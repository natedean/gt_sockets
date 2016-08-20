exports.findOpponentId = (state, roomId, playerId) => {
	return state.getIn([roomId, 'players']).keySeq().filter(x => {
		return x !== playerId;
	}).first();
};

exports.findAvailableRoomId = (state) => {
	return state.findKey(x => x.get('players').size < 2);
};

exports.hasVacancy = (state) => state.filter(x => x.get('players').size < 2).size > 0;