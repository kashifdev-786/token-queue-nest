'use strict';

var crypto = require('crypto');
var WebSocket = require('ws');

var BASE_URL = 'speech.platform.bing.com/consumer/speech/synthesize/readaloud';
var TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
var WSS_URL = 'wss://' + BASE_URL + '/edge/v1?TrustedClientToken=' + TRUSTED_CLIENT_TOKEN;
var CHROMIUM_FULL_VERSION = '143.0.3650.75';
var CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split('.')[0];
var SEC_MS_GEC_VERSION = '1-' + CHROMIUM_FULL_VERSION;
var WIN_EPOCH = 11644473600;
var S_TO_NS = 1e9;

var WSS_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/' +
    CHROMIUM_MAJOR_VERSION +
    '.0.0.0 Safari/537.36 Edg/' +
    CHROMIUM_MAJOR_VERSION +
    '.0.0.0',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Accept-Language': 'en-US,en;q=0.9',
  Pragma: 'no-cache',
  'Cache-Control': 'no-cache',
  Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
  'Sec-WebSocket-Version': '13',
};

var clockSkewSeconds = 0;

function getUnixTimestamp() {
  return Date.now() / 1000 + clockSkewSeconds;
}

function generateSecMsGec() {
  var ticks = getUnixTimestamp();
  ticks += WIN_EPOCH;
  ticks -= ticks % 300;
  ticks *= S_TO_NS / 100;
  return crypto
    .createHash('sha256')
    .update(ticks.toFixed(0) + TRUSTED_CLIENT_TOKEN, 'ascii')
    .digest('hex')
    .toUpperCase();
}

function generateMuid() {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}

function headersWithMuid(headers) {
  var out = {};
  var key;
  for (key in headers) {
    if (Object.prototype.hasOwnProperty.call(headers, key)) out[key] = headers[key];
  }
  out.Cookie = 'muid=' + generateMuid() + ';';
  return out;
}

function connectId() {
  return crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '')
    : crypto.randomBytes(16).toString('hex');
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function removeIncompatibleCharacters(text) {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ');
}

function normalizeVoice(voice) {
  var match = /^([a-z]{2,})-([A-Z]{2,})-(.+Neural)$/.exec(voice);
  if (!match) return voice;
  var lang = match[1];
  var region = match[2];
  var name = match[3];
  if (name.indexOf('-') !== -1) {
    var parts = name.split('-');
    region += '-' + parts[0];
    name = parts[1];
  }
  return 'Microsoft Server Speech Text to Speech Voice (' + lang + '-' + region + ', ' + name + ')';
}

function mkssml(voice, rate, volume, pitch, text) {
  return (
    "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>" +
    "<voice name='" +
    voice +
    "'><prosody pitch='" +
    pitch +
    "' rate='" +
    rate +
    "' volume='" +
    volume +
    "'>" +
    text +
    '</prosody></voice></speak>'
  );
}

function dateToString() {
  return new Date().toUTCString().replace('GMT', 'GMT+0000 (Coordinated Universal Time)');
}

function ssmlHeadersPlusData(requestId, timestamp, ssml) {
  return (
    'X-RequestId:' +
    requestId +
    '\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:' +
    timestamp +
    'Z\r\nPath:ssml\r\n\r\n' +
    ssml
  );
}

function getHeadersAndDataFromText(message) {
  var headerLength = message.indexOf('\r\n\r\n');
  var headers = {};
  var headerString = message.slice(0, headerLength).toString('utf-8');
  if (headerString) {
    var headerLines = headerString.split('\r\n');
    for (var i = 0; i < headerLines.length; i++) {
      var line = headerLines[i];
      var colon = line.indexOf(':');
      if (colon !== -1) headers[line.slice(0, colon)] = line.slice(colon + 1).trim();
    }
  }
  return [headers, message.slice(headerLength + 2)];
}

function getHeadersAndDataFromBinary(message) {
  var headerLength = message.readUInt16BE(0);
  var headers = {};
  var headerString = message.slice(2, headerLength + 2).toString('utf-8');
  if (headerString) {
    var headerLines = headerString.split('\r\n');
    for (var i = 0; i < headerLines.length; i++) {
      var line = headerLines[i];
      var colon = line.indexOf(':');
      if (colon !== -1) headers[line.slice(0, colon)] = line.slice(colon + 1).trim();
    }
  }
  return [headers, message.slice(headerLength + 2)];
}

function synthesizeOnce(text, voice, rate, volume, pitch) {
  return new Promise(function (resolve, reject) {
    var url =
      WSS_URL +
      '&Sec-MS-GEC=' +
      generateSecMsGec() +
      '&Sec-MS-GEC-Version=' +
      SEC_MS_GEC_VERSION +
      '&ConnectionId=' +
      connectId();
    var ws = new WebSocket(url, { headers: headersWithMuid(WSS_HEADERS) });
    var messageQueue = [];
    var resolveMessage = null;
    var audioChunks = [];
    var audioWasReceived = false;
    var closed = false;

    function finishOk() {
      if (closed) return;
      closed = true;
      resolve(Buffer.concat(audioChunks));
    }

    function finishErr(err) {
      if (closed) return;
      closed = true;
      reject(err);
    }

    function processQueue() {
      while (messageQueue.length > 0) {
        var message = messageQueue.shift();
        if (message === 'close') {
          if (!audioWasReceived) finishErr(new Error('No audio was received.'));
          else finishOk();
          return;
        }
        if (message instanceof Error) {
          finishErr(message);
          return;
        }
        if (message.type === 'audio') {
          audioWasReceived = true;
          audioChunks.push(message.data);
        }
      }
    }

    function waitForMore() {
      processQueue();
      if (closed) return;
      resolveMessage = function () {
        resolveMessage = null;
        processQueue();
        if (!closed) waitForMore();
      };
      setTimeout(function () {
        if (resolveMessage) resolveMessage();
      }, 50);
    }

    ws.on('message', function (data, isBinary) {
      if (!isBinary) {
        var textBuf = Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf-8');
        var parsed = getHeadersAndDataFromText(textBuf);
        var path = parsed[0].Path;
        if (path === 'turn.end') ws.close();
      } else if (data.length >= 2) {
        var binary = getHeadersAndDataFromBinary(data);
        var headers = binary[0];
        var audioData = binary[1];
        if (headers.Path === 'audio' && headers['Content-Type'] === 'audio/mpeg' && audioData.length) {
          messageQueue.push({ type: 'audio', data: audioData });
        }
      }
      if (resolveMessage) resolveMessage();
    });

    ws.on('error', function (err) {
      messageQueue.push(err);
      if (resolveMessage) resolveMessage();
    });

    ws.on('close', function () {
      messageQueue.push('close');
      if (resolveMessage) resolveMessage();
    });

    ws.on('open', function () {
      ws.send(
        'X-Timestamp:' +
          dateToString() +
          '\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n' +
          '{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n'
      );
      ws.send(ssmlHeadersPlusData(connectId(), dateToString(), mkssml(voice, rate, volume, pitch, text)));
      waitForMore();
    });
  });
}

function synthesize(text, voice, options) {
  options = options || {};
  var rate = options.rate || '+0%';
  var volume = options.volume || '+0%';
  var pitch = options.pitch || '+0Hz';
  var normalizedVoice = normalizeVoice(voice || 'hi-IN-SwaraNeural');
  var safeText = escapeXml(removeIncompatibleCharacters(text));
  return synthesizeOnce(safeText, normalizedVoice, rate, volume, pitch);
}

module.exports = {
  synthesize: synthesize,
  TTS_VOICE: 'hi-IN-SwaraNeural',
};
