'use strict';

const Immutable = require('immutable');

exports.createNewRoom = () => {
	let map = Immutable.Map();

	map = map.set('isInProgress', false);
	map = map.set('players', Immutable.Map());

	return map;
};

exports.createPlayer = (name) => Immutable.Map({
	name,
	answers: Immutable.List()
});