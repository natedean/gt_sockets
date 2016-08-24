'use strict';

const app = require('express')();

// socket.io hookup
const server = require('http').Server(app);
const io = require('socket.io')(server);
server.listen(3001, () => console.log("socket.io server listening on port 3001"));

const Immutable = require('immutable');
const store = require('./store');
const helpers = require('./helpers');

let RoomMap = Immutable.Map();

store.RoomMap$.subscribe(x => {
  x.forEach((room, roomKey) => {
    // if no change to this room, bail!
    if (room.equals(RoomMap.get(roomKey))) { return; }

    room.get('players').forEach((player, playerKey) => {
      emitStateUpdate(player.get('socket'), room, playerKey)
    });
  });

  RoomMap = x; // cache this for dirty checks
});

const emitStateUpdate = (socket, room, playerId) => {
    socket.emit('stateChange', helpers.createResponse(room, playerId)); // the client will optimistically update, but then we need to sync up just in case
};

io.on('connection', function (socket) {

  const playerId = socket.client.id; // this really needs to pass the players mongo uid if available

  let roomId;

  socket.on('join', (data) => {
    // if there are no empty rooms, add a room.
    store.addNewRoomIfNecessary$.next();

    // // find the first available room id
    roomId = helpers.findAvailableRoomId(RoomMap);

    // add player to the first available room
    store.addPlayerToRoom$.next({ roomId, playerId, socket });

    // start game, if able
    store.startGameIfAble$.next(roomId);
  });

  socket.on('answerEvent', (data) => {
    store.setAnswer$.next({ roomId, playerId, isCorrect: data.isCorrect });
  });

  socket.on('disconnect', () => {
    if (!roomId) { return; }


    // RoomMap = RoomMap.removeIn([roomId, 'players', playerId]);
    // RoomMap = RoomMap.setIn([roomId, 'isInProgress'], false);

    // NEED TO HANDLE THIS!
  });
});
