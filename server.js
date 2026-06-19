'use strict';

var path = require('path');
var os = require('os');
var express = require('express');
var http = require('http');
var socketIo = require('socket.io');
var tts = require('./lib/tts');

var APP_PORT = 4789;

var state = {
  room1: { current: null, callSeq: 0 },
  room2: { current: null, callSeq: 0 },
  announcement: '',
};

function getState() {
  return state;
}

function updateToken(room, token) {
  state[room].current = token;
  state[room].callSeq += 1;
  return state;
}

function updateAnnouncement(text) {
  state.announcement = text;
  return state;
}

function getLanIp() {
  try {
    var nets = os.networkInterfaces();
    var lanIp = 'localhost';
    var ifaceName;
    var iface;
    var addr;
    for (ifaceName in nets) {
      if (!Object.prototype.hasOwnProperty.call(nets, ifaceName)) continue;
      iface = nets[ifaceName];
      for (var i = 0; i < iface.length; i++) {
        addr = iface[i];
        if ((addr.family === 'IPv4' || addr.family === 4) && !addr.internal) {
          lanIp = addr.address;
          return lanIp;
        }
      }
    }
    return lanIp;
  } catch (e) {
    return 'localhost';
  }
}

var app = express();
var server = http.createServer(app);
var io = socketIo(server, { cors: { origin: true } });

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/tts', function (req, res) {
  var token = req.query.token;
  var room = req.query.room;
  var test = req.query.test;
  var promise;

  if (test === '1') {
    promise = tts.synthesizeTest();
  } else {
    var tokenNum = parseInt(token, 10);
    if (!tokenNum || tokenNum < 1 || tokenNum > 1000) {
      res.status(400).send('Invalid token (use 1-1000)');
      return;
    }
    if (!room || (room !== 'room1' && room !== 'room2')) {
      res.status(400).send('Invalid room');
      return;
    }
    promise = tts.synthesizeToken(tokenNum, room);
  }

  promise
    .then(function (audio) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-TTS-Voice', tts.getVoiceName());
      res.send(audio);
    })
    .catch(function (error) {
      tts.logFailure(error);
      res.status(400).send('Urdu speech unavailable - check server internet connection');
    });
});

io.on('connection', function (socket) {
  socket.emit('state', getState());

  socket.on('updateToken', function (data) {
    if (!data || (data.room !== 'room1' && data.room !== 'room2')) return;
    var token = parseInt(data.token, 10);
    if (!token || token < 1 || token > 1000) return;
    io.emit('state', updateToken(data.room, token));
  });

  socket.on('updateAnnouncement', function (text) {
    io.emit('state', updateAnnouncement(typeof text === 'string' ? text : ''));
  });
});

tts.warmUp();

server.listen(Number(process.env.PORT) || APP_PORT, '0.0.0.0', function () {
  var port = Number(process.env.PORT) || APP_PORT;
  var lanIp = getLanIp();
  console.log('\nToken Queue Server running');
  console.log('   Local:   http://localhost:' + port);
  console.log('   Display: http://' + lanIp + ':' + port + '/display');
  console.log('   Room 1:  http://' + lanIp + ':' + port + '/room1');
  console.log('   Room 2:  http://' + lanIp + ':' + port + '/room2');
  console.log('   Urdu TTS: http://' + lanIp + ':' + port + '/api/tts?test=1\n');
});
