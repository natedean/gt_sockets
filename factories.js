'use strict';

const Immutable = require('immutable');

exports.createNewRoom = () => {
	let map = Immutable.Map();

	map = map.set('isInProgress', false);
	map = map.set('timer', 10);
	map = map.set('players', Immutable.Map());

	return map;
};

exports.createPlayer = (name, socket) => Immutable.Map({
	name,
	answers: Immutable.List(),
	socket: socket
});