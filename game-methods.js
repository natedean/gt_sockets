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

const calcMessage = (isCorrect, timer) => {
	switch (isCorrect) {
		case true:
			return 'Correct!';
		case false:
			return 'Incorrect';
		case undefined:
			return `Waiting: ${timer}`
	}
};

exports.startNewGame = (game) => {
	game = game.set('isInProgress', true);
	game = addNewQuestion(game);

	return game;
};

exports.syncRoomState = (game) => {
	const questionArrSize = game.get('questionIds').size;

	// how many players have answered the current question?
	const numPlayersScored = game.get('players').filter(x => x.get('answers').size >= questionArrSize).size;

	if (numPlayersScored < 1) { return game; } // nobody has score for this question!

	// somebody scored, we're now on the clock
	game = game.set('timer', game.get('timer') - 1);


	if (game.get('timer') === 0) {
		// force update player's scores // time's up
		game = game.set('players', game.get('players').map(player => {
			if (player.get('answers').size !== questionArrSize) {
				player = player.set('answers', player.get('answers').push(false));
			}
			return player;
		}));
	}

	if (numPlayersScored === 2 && game.get('timer') > 0) {
		game = game.set('timer', 0);
	}

	// between 0 and -5 is like reflection time... displaying the correct answer... and maybe some game stats or something...
    // ... maybe display like a bonus point award ... or whatever

	if (game.get('timer') <= -5) { // this round is over. reset timer, add new new question.
		game = game.set('timer', 10);
		game = addNewQuestion(game);
	}

	// game = game.set('timer', game.get('timer') - 1);

	return game;
};

exports.setPlayerMessages = (room) => {
	if (room.get('timer') === 10) {
		room = room.setIn(['me', 'message'], '');
		room = room.setIn(['opponent', 'message'], '');

		return room;
	}

	// somebody in the room has answered and we're on a timer now, update player messages
	const i = room.get('questionIds').size - 1;

	room = room.setIn(['me', 'message'], calcMessage(room.getIn(['me', 'answers']).get(i), room.get('timer')));
	room = room.setIn(['opponent', 'message'], calcMessage(room.getIn(['opponent', 'answers']).get(i), room.get('timer')));

	return room;
};
