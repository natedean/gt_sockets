'use strict';

const app = require('express')();

// socket.io hookup
var server = require('http').Server(app);
var io = require('socket.io')(server);
server.listen(3001, () => console.log("socket.io server listening on port 3001"));

const uuid = require('node-uuid');
const Immutable = require('immutable');

let RoomsMap = Immutable.Map();

const createNewRoom = () => {
  let map = Immutable.Map();

  map = map.set('isInProgress', false);
  map = map.set('players', Immutable.Map());

  return map;
};

const createPlayer = (name) => Immutable.Map({
  name,
  answers: Immutable.List()
});

const hasVacancy = (RoomsMap) => RoomsMap.filter(x => x.get('players').size < 2).size > 0;

const addRoomIfNecessary = (RoomsMap, playerId) => {
  if (RoomsMap.size && hasVacancy(RoomsMap)) { return RoomsMap; }

  return RoomsMap.set(uuid.v4(), createNewRoom());
};

const findAvailableRoomId = (RoomsMap) => {
  return RoomsMap.findKey(x => x.get('players').size < 2);
};

const createResponse = (RoomsMap, roomId, playerId, opponentId) => {
  let room = Immutable.Map();

  room = room.set('isInProgress', RoomsMap.getIn([roomId, 'isInProgress']));
  room = room.set('me', RoomsMap.getIn([roomId, 'players', playerId]));

  if (opponentId) {
    room = room.set('opponent', RoomsMap.getIn([roomId, 'players', opponentId]));
  }

  return room;
};

const findOpponentId = (RoomsMap, roomId, playerId) => {
  return RoomsMap.getIn([roomId, 'players']).keySeq().filter(x => {
    return x !== playerId;
  }).first();
}

const emitStateUpdate = (socket, RoomsMap, roomId, playerId) => {
    const opponentId = findOpponentId(RoomsMap, roomId, playerId);

    // send player update
    socket.emit('stateChange', createResponse(RoomsMap, roomId, playerId, opponentId)); // the client will optimistically update, but then we need to sync up just in case
    
    // send opponent update
    socket.to(roomId).emit('stateChange', createResponse(RoomsMap, roomId, opponentId, playerId)); // notify the room!
}

io.on('connection', function (socket) {

  const playerId = socket.client.id; // this really needs to pass the players mongo uid if available

  // if there are no empty rooms, add a room.
  RoomsMap = addRoomIfNecessary(RoomsMap);

  // find the first available room id
  let roomId = findAvailableRoomId(RoomsMap);

  // add player to the first available room
  RoomsMap = RoomsMap.setIn([roomId, 'players', playerId], createPlayer('Barry' + Math.floor(Math.random() * 1000)));

  // socket, join room
  socket.join(roomId);

  // start game, if able
  if (RoomsMap.getIn([roomId, 'players']).size === 2) {
    RoomsMap = RoomsMap.setIn([roomId, 'isInProgress'], true);
  }

  // emit state update
  emitStateUpdate(socket, RoomsMap, roomId, playerId);

  socket.on('answerEvent', (data) => {
    RoomsMap = RoomsMap.setIn([roomId, 'players', playerId, 'answers'],
      RoomsMap.getIn([roomId, 'players', playerId, 'answers']).push(data.isCorrect));

      // emit state update
    emitStateUpdate(socket, RoomsMap, roomId, playerId);
  });

  socket.on('disconnect', () => {
    RoomsMap = RoomsMap.removeIn([roomId, 'players', playerId]);
    RoomsMap = RoomsMap.setIn([roomId, 'isInProgress'], false);
      // emit state update
    emitStateUpdate(socket, RoomsMap, roomId, playerId);
  });
});