'use strict';

var edgeTts = require('./edge-tts');
var announcement = require('./announcement');

var cache = new Map();
var ready = false;

function synthesizeSpeech(text) {
  var cacheKey = 'text:' + text;
  if (cache.has(cacheKey)) return Promise.resolve(cache.get(cacheKey));

  return edgeTts
    .synthesize(text, edgeTts.TTS_VOICE, { rate: '-8%' })
    .then(function (audio) {
      if (!audio.length) throw new Error('TTS returned empty audio');
      cache.set(cacheKey, audio);
      ready = true;
      return audio;
    });
}

function synthesizeToken(token, room) {
  var cacheKey = 'token:' + room + ':' + token;
  if (cache.has(cacheKey)) return Promise.resolve(cache.get(cacheKey));

  var text = announcement.buildSpokenAnnouncement(token, room);
  return synthesizeSpeech(text).then(function (audio) {
    cache.set(cacheKey, audio);
    return audio;
  });
}

function synthesizeTest() {
  var cacheKey = 'test:1';
  if (cache.has(cacheKey)) return Promise.resolve(cache.get(cacheKey));

  return synthesizeSpeech(announcement.buildSpokenTestAnnouncement()).then(function (audio) {
    cache.set(cacheKey, audio);
    return audio;
  });
}

function warmUp() {
  synthesizeTest().catch(function (err) {
    console.warn('TTS warm-up failed: ' + (err && err.message ? err.message : String(err)));
  });
}

function getVoiceName() {
  return edgeTts.TTS_VOICE;
}

function isReady() {
  return ready;
}

function logFailure(error) {
  console.warn('Swara TTS failed: ' + (error && error.message ? error.message : String(error)));
}

module.exports = {
  warmUp: warmUp,
  synthesizeToken: synthesizeToken,
  synthesizeTest: synthesizeTest,
  getVoiceName: getVoiceName,
  isReady: isReady,
  logFailure: logFailure,
};
