'use strict';

const Immutable = require('immutable');

exports.createNewRoom = () => {
	let map = Immutable.Map();

	map = map.set('isInProgress', false);
	map = map.set('players', Immutable.Map());
	map = map.set('timer', 10);
	map = map.set('questionIds', Immutable.List());

	return map;
};

exports.createPlayer = (name, socket) => Immutable.Map({
	name,
	answers: Immutable.List(),
	socket: socket,
	message: ''
});
