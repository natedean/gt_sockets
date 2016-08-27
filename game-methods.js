'use strict';

const helpers = require('./helpers');

const ChordMap = require('./questions').ChordMap;
const ChordList = ChordMap.toList();

const getRandQuestion = () => { // maybe at some point take different question type options
	const rand = Math.floor(Math.random() * ChordList.size); // map is NOT 0 based

	let result = ChordList.get(rand);

	result.answers = helpers.shuffle(result.answers);

	return result;
};

const addNewQuestion = (game) => {
	game = game.set('question', getRandQuestion());
	game = game.set('questionIds', game.get('questionIds').push(game.get('question').id));

	return game;
};

exports.startNewGame = (game) => {
	game = game.set('isInProgress', true);
	game = addNewQuestion(game);

	return game;
};

exports.syncRoomState = (game) => {

	// have any players scored ???

	// testing... if the a player scores, give the other player a wrong point.
	const questionIndex = game.get('questionIds').size;

	// how many players have answered the current question?
	const numPlayersScored = game.get('players').filter(x => x.get('answers').size >= questionIndex).size;

	if (numPlayersScored < 1) { return game; } // nobody has score for this question!

	if (numPlayersScored === 1) { // one player has answered!

		// this code is blowing up.

		// game = game.set('players', game.get('players').map(player => {
		// 	if (player.get('answers').size !== questionIndex) {
		// 		return player = player.set('answers', player.get('answers').push(false));
		// 	}
		// }));

	}

	if (numPlayersScored === 2) { // new question!
		game = addNewQuestion(game);
	}

	// game = game.set('timer', game.get('timer') - 1);

	return game;
};
