'use strict';

const helpers = require('./helpers');
const ChordMap = require('./questions').ChordMap;
const ChordList = ChordMap.toList();

exports.getRandQuestion = () => { // maybe at some point take different question type options
	const rand = Math.floor(Math.random() * ChordList.size); // map is NOT 0 based

	let result = ChordList.get(rand);

	result.answers = helpers.shuffle(result.answers);

	return result;
};
