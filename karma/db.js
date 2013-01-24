var mongodb = require('mongodb');

var connect = function (coll, callback) {
	var server = new mongodb.Server("127.0.0.1", 27017, {});
	new mongodb.Db('karmasite', server, {w:0}).open(function (error, client) {
		if (error) {
			throw error;
		}

		var collection = new mongodb.Collection(client, coll);
		callback(collection, client);
	});
}

var getUser = function (userName, callback) {
	connect('users', function (coll, client) {
		coll.findOne({'name':userName}, function (err, user) {
			callback(user);
			client.close();
		});
	});
}

var getToken = function (token, callback) {
	connect('tokens', function (coll, client) {
		coll.findOne({'token':token}, function (err, token) {
			callback(token);
			client.close();
		});
	});
}

var getBestTokens = function (limit, callback) {
	connect('tokens', function (coll, client) {
		var cursor = coll.find({});
		cursor.sort({'vote':-1}).limit(limit);
		cursor.toArray(function (err, tokens) {
			callback(tokens);
			client.close();
		});
	});
}

var getWorstTokens = function (limit, callback) {
	connect('tokens', function (coll, client) {
		var cursor = coll.find({});
		cursor.sort({'vote':1}).limit(limit);
		cursor.toArray(function (err, tokens) {
			callback(tokens);
			client.close();
		});
	});
}

var getHottestTokens = function (limit, callback) {
	connect('tokens', function (coll, client) {
		var cursor = coll.find({});
		cursor.sort({'votecount':-1}).limit(limit);
		cursor.toArray(function (err, tokens) {
			callback(tokens);
			client.close();
		});
	});
}

var getRecentTokens = function (limit, callback) {
	connect('tokens', function (coll, client) {
		var cursor = coll.find({});
		cursor.sort({'created':-1}).limit(limit);
		cursor.toArray(function (err, tokens) {
			callback(tokens);
			client.close();
		});
	});
}

var insertUser = function (userName, password, callback) {
	connect('users', function (coll, client) { 
		coll.insert({'name':userName, 'created':new Date(), 'votecount':0, 'password':password, 'plus':[], 'minus':[]});
		if (callback) {
			callback();
		}
		client.close();
	});
}

var insertToken = function (token, callback) {
	connect('tokens', function (coll, client) {
		coll.insert({'token':token, 'created':new Date(), 'vote':0, 'votecount':0, 'plus':[], 'minus':[]});
		if (callback) {
			callback();
		}
		client.close();
	})
}

var insertVote = function (userName, token, voteAmount, callback) {
	getToken(token, function (foundToken) {
		if (!foundToken) {
			insertToken(token, function () {
				insertVoteQ(userName, token, voteAmount, callback);
			});
		} else {
			insertVoteQ(userName, token, voteAmount, callback);
		}
	});
}

var insertVoteQ = function (userName, token, voteAmount, callback) {	
	var arrName = voteAmount === 1 ? 'plus' : 'minus';
	connect('tokens', function (collTokens, client) {
		var updateTokensStatement = {};
		updateTokensStatement['$push'] = {};
		updateTokensStatement['$push'][arrName] = userName;
		updateTokensStatement['$inc'] = {};
		updateTokensStatement['$inc']['votecount'] = 1;
		updateTokensStatement['$inc']['vote'] = voteAmount;
		updateTokensStatement['$set'] = {};
		updateTokensStatement['$set']['lastvote'] = new Date();
		collTokens.update({'token':token}, updateTokensStatement);
		connect('users', function (collUsers, client) {
			var updateUsersStatement = {};
			updateUsersStatement['$push'] = {};
			updateUsersStatement['$push'][arrName] = token;
			updateUsersStatement['$inc'] = {};
			updateUsersStatement['$inc']['votecount'] = 1;
			updateUsersStatement['$set'] = {};
			updateUsersStatement['$set']['lastvote'] = new Date();
			collUsers.update({'name':userName}, updateUsersStatement);
			if (callback) {
				callback();
			}
			client.close();
		});
	});
}

module.exports.getToken = getToken;
module.exports.getUser = getUser;
module.exports.getBestTokens = getBestTokens;
module.exports.getWorstTokens = getWorstTokens;
module.exports.getHottestTokens = getHottestTokens;
module.exports.getRecentTokens = getRecentTokens;
module.exports.insertUser = insertUser;
module.exports.insertToken = insertToken;
module.exports.insertVote = insertVote;