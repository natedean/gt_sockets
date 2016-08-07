'use strict';

const app = require('express')();

// socket.io hookup
var server = require('http').Server(app);
var io = require('socket.io')(server);
server.listen(3001);

const uuid = require('node-uuid');
const Immutable = require('immutable');

let RoomsMap = Immutable.Map();

const createNewRoom = () => {
  return Immutable.Map({
    gameIsInProgress: false,
    players: Immutable.Map()
  });
};

const createPlayer = () => Immutable.Map({
  correctAnswers: 0,
  incorrectAnswers: 0
});

const hasVacancy = (RoomsMap) => RoomsMap.filter(x => x.get('players').size < 2).size > 0;

const addRoomIfNecessary = (RoomsMap, playerId) => {
  if (RoomsMap.size && hasVacancy(RoomsMap)) { return RoomsMap; }

  return RoomsMap.set(uuid.v4(), createNewRoom());
};

const findAvailableRoomId = (RoomsMap) => {
  return RoomsMap.findKey(x => x.get('players').size < 2);
};

io.on('connection', function (socket) {
  const playerId = socket.client.id; // this really needs to pass the players mongo uid if available

  // if there are no empty rooms, add a room.
  RoomsMap = addRoomIfNecessary(RoomsMap);

  // find the first available room id
  let roomId = findAvailableRoomId(RoomsMap);

  // add player to the first available room
  RoomsMap = RoomsMap.setIn([roomId, 'players', playerId], createPlayer());

  // socket, join room
  socket.join(roomId);

  socket.emit('joined', roomId);

  socket.on('answerEvent', (data) => {
    // update game object!
    if (data.isCorrect) {
      RoomsMap = RoomsMap.setIn([roomId, 'players', playerId, 'correctAnswers'], RoomsMap.getIn([roomId, 'players', playerId, 'correctAnswers']) + 1);
    } else {
      RoomsMap = RoomsMap.setIn([roomId, 'players', playerId, 'incorrectAnswers'], RoomsMap.getIn([roomId, 'players', playerId, 'incorrectAnswers']) + 1);
    }

    socket.emit('answerEvent', RoomsMap.get(roomId).toJS()); // the client will optimistically update, but then we need to sync up just in case
    socket.to(roomId).emit('answerEvent', RoomsMap.get(roomId).toJS()); // notify the room!
  });

  console.log('somebody joined! RoomsMap.size: ', RoomsMap.size);

  // start game, if able
  if (RoomsMap.getIn([roomId, 'players']).size === 2) {
    RoomsMap = RoomsMap.setIn([roomId, 'gameIsInProgress'], true);
    socket.emit('startGame', RoomsMap.get(roomId).toJS()); // tell me to startGame
    socket.to(roomId).emit('startGame', RoomsMap.get(roomId).toJS()); // tell others in room to startGame
  }

  socket.on('disconnect', () => {
    RoomsMap = RoomsMap.removeIn([roomId, 'players', playerId]);
    RoomsMap = RoomsMap.setIn([roomId, 'gameIsInProgress'], false);
    socket.to(roomId).emit('endGame', RoomsMap.get(roomId).toJS()); // tell others in room to startGame
  });
});