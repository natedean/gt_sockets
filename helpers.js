'use strict';

const Immutable = require('immutable');
const gameMethods = require('./game-methods');

exports.findAvailableRoomId = (state) => {
	return state.findKey(x => x.get('players').size < 2);
};

exports.hasVacancy = (state) => state.filter(x => x.get('players').size < 2).size > 0;

exports.createResponse = (room, playerId) => {

	// remove sockets from players before we ship them back to the client
	room = room.set('players', room.get('players').map(x => x.delete('socket')));
	room = room.set('me', room.getIn(['players', playerId]));

	room = room.deleteIn(['players', playerId]);

	if (room.get('players').size) {
		room = room.set('opponent', room.get('players').first());
	}

	room = room.delete('players');

	if (!room.get('isInProgress')) { return room; }

	room = gameMethods.setPlayerMessages(room);

	return room;
};

exports.shuffle = (array) => {
	var currentIndex = array.length, temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
};
