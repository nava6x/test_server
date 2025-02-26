const http = require('http');
const express = require('express');
const app = express();
const cors = require('cors');
const socketio = require('socket.io');
const AuthVerified = require('./authorized/core');

const PORT = 4500;
app.use(cors());

const server = http.createServer(app);
const io = socketio(server, {
     cors: {
          origin: "http://localhost:3000",
          methods: ["GET", "POST"],
     },
});

io.use(async (socket, next) => {
     try {
          const RES = await AuthVerified(socket.handshake, socket.id);
          if (RES[0]) {
               socket.new_authed_userdata = { "state": true, "apid": RES[1], "agent": RES[2] };
               return next();
          } else {
               socket.new_authed_userdata = { "state": false };
               return next();
          }
     } catch (error) {
          socket.new_authed_userdata = { "state": false };
          return next();
     }
});
io.on('connection', async (socket) => {
     const { state, apid, agent } = socket['new_authed_userdata'];
     if (state) {
          console.log(`\x1b[35m${socket.id} Connected\x1b[0m`);
          socket.emit('main', ({ status: 201, content: { Pid: apid, Agent: agent, SocketID: socket.id  } }));
     } else {
          socket.emit('main', ({ status: 401, msg: 'Unauthorized' }));
     }
});

server.listen(PORT, () => {
     console.log('\x1b[94mWesser Running\x1b[0m');
});