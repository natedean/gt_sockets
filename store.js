'use strict';

const Immutable = require('immutable');
const uuid = require('node-uuid');
const Rx = require('rxjs');

const helpers = require('./helpers');
const factories = require('./factories');
const gameMethods = require('./game-methods');

const addNewRoomIfNecessary$ = new Rx.Subject().map(() => state => {
	if (state.size && helpers.hasVacancy(state)) { return state; }

	return state = state.set(uuid.v4(), factories.createNewRoom());
});

const addPlayerToRoom$ = new Rx.Subject().map(payload => state => {
	return state = state.setIn([payload.roomId, 'players', payload.playerId],
		factories.createPlayer('Barry' + Math.floor(Math.random() * 1000), payload.socket));
});

const startGameIfAble$ = new Rx.Subject().map((gameId) => state => {
	if (state.getIn([gameId, 'players']).size !== 2) { return state; }

	state = state.set(gameId, gameMethods.startNewGame(state.get(gameId)));

	return state;
});

const setAnswer$ = new Rx.Subject().map(payload => state => {
	state = state.setIn([payload.roomId, 'players', payload.playerId, 'answers'],
		state.getIn([payload.roomId, 'players', payload.playerId, 'answers']).push(payload.isCorrect));

	return state;
});

const monitorRoomStatesTimer$ = Rx.Observable.interval(1000).map(() => state => {
	state = state.map(game => {
		if (!game.get('isInProgress')) { return game; } // don't sync games that haven't started

		return game = gameMethods.syncRoomState(game);
	});

	return state;
});

const RoomMap$ = Rx.Observable.merge(
	addNewRoomIfNecessary$,
	addPlayerToRoom$,
	startGameIfAble$,
	setAnswer$,
	monitorRoomStatesTimer$
).scan((state, changeFn) => changeFn(state), Immutable.Map());

exports.RoomMap$ = RoomMap$;
exports.addNewRoomIfNecessary$ = addNewRoomIfNecessary$;
exports.addPlayerToRoom$ = addPlayerToRoom$;
exports.startGameIfAble$ = startGameIfAble$;
exports.setAnswer$ = setAnswer$;
