'use strict';

const app = require('express')();

// socket.io hookup
const server = require('http').Server(app);
const io = require('socket.io')(server);
server.listen(3001, () => console.log("socket.io server listening on port 3001"));

const Immutable = require('immutable');
const store = require('./store');
const helpers = require('./helpers');

let RoomMap;

store.RoomMap$.subscribe(x => {
  RoomMap = x;
});

const createResponse = (RoomMap, roomId, playerId, opponentId) => {
  let room = Immutable.Map();

  room = room.set('isInProgress', RoomMap.getIn([roomId, 'isInProgress']));
  room = room.set('me', RoomMap.getIn([roomId, 'players', playerId]));

  if (opponentId) {
    room = room.set('opponent', RoomMap.getIn([roomId, 'players', opponentId]));
  }

  return room;
};

const emitStateUpdate = (RoomMap, socket, roomId, playerId) => {
  const opponentId = helpers.findOpponentId(RoomMap, roomId, playerId);

    // send player update
    socket.emit('stateChange', createResponse(RoomMap, roomId, playerId, opponentId)); // the client will optimistically update, but then we need to sync up just in case

    // send opponent update
    socket.to(roomId).emit('stateChange', createResponse(RoomMap, roomId, opponentId, playerId)); // notify the room!
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
    store.addPlayerToRoom$.next({ roomId, playerId });

    /// socket, join room
    socket.join(roomId);

    // start game, if able
    store.startGameIfAble$.next(roomId);

    // emit state update
    emitStateUpdate(RoomMap, socket, roomId, playerId);
  });

  socket.on('answerEvent', (data) => {
    store.setAnswer$.next({ roomId, playerId, isCorrect: data.isCorrect });

    // emit state update
    emitStateUpdate(RoomMap, socket, roomId, playerId);
  });

  socket.on('disconnect', () => {
    if (!roomId) { return; }

    // RoomMap = RoomMap.removeIn([roomId, 'players', playerId]);
    // RoomMap = RoomMap.setIn([roomId, 'isInProgress'], false);

    // NEED TO HANDLE THIS!
  });
});
