'use strict';

const Immutable = require('immutable');

exports.findAvailableRoomId = (state) => {
	return state.findKey(x => x.get('players').size < 2);
};

exports.hasVacancy = (state) => state.filter(x => x.get('players').size < 2).size > 0;

exports.createResponse = (room, playerId) => {
	let response = Immutable.Map();

	response = response.set('isInProgress', room.get('isInProgress'));
	response = response.set('timer', room.get('timer'));

	// remove sockets from players before we ship them back to the client
	room = room.set('players', room.get('players').map(x => x.delete('socket')));

	response = response.set('me', room.getIn(['players', playerId]));

	room = room.deleteIn(['players', playerId]);

	if (room.get('players').size) {
		response = response.set('opponent', room.get('players').first());
	}

	return response;
};