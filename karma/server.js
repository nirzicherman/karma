var express = require('express');kgg
var app = express();
var db = require('./db.js');

app.use(express.cookieParser('thisIStheSecret0fExpreSS'));

app.use(express.bodyParser());

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/view'));

app.engine('.html', require('ejs').renderFile);

app.get('/file/:file', function (req, res) {
	res.render(req.params.file);
});

app.get('/', function (req, res) {
	res.render('home.html', {username:req.signedCookies.u});
});

app.get('/register', function (req, res) {
	res.render('register.html');
});

app.get('/karma/:token', function (req, res) {
	db.getToken(req.params.token, function (token) {
		if (!token) {
			res.send({});
		} else {
			var webToken = {
				token:token.token,
				karma:token.vote,
				votecount:token.votecount,
				created:token.created,
				lastvote:token.lastvote,
				plus:token.plus,
				minus:token.minus
			};
			res.send(webToken);
		}
	});
});

app.get('/best/:limit', function (req, res) {
	getList('getBestTokens', req, res);
});

app.get('/worst/:limit', function (req, res) {
	getList('getWorstTokens', req, res);
});

app.get('/hottest/:limit', function (req, res) {
	getList('getHottestTokens', req, res);
});

app.get('/recent/:limit', function (req, res) {
	getList('getRecentTokens', req, res);
});

app.get('/news/:limit', function (req, res) {
	var parsedLimit = parseInt(req.params.limit);
	if (!parsedLimit) {
		res.send({tokens:[]});
		return;
	}
	db.getRecentNews(parsedLimit, function (events) {
		res.send({events:events});
	});
});

var getList = function (type, req, res) {
	var parsedLimit = parseInt(req.params.limit);
	if (!parsedLimit) {
		res.send({tokens:[]});
		return;
	}
	db[type](parsedLimit, function (tokens) {
		if (!tokens) {
			res.send({tokens:[]});
		} else {
			var webTokens = [];
			for (var i = 0; i < tokens.length; i++) {
				var webToken = {
					token:tokens[i].token,
					karma:tokens[i].vote,
					votecount:tokens[i].votecount,
					created:tokens[i].created,
					lastvote:tokens[i].lastvote,
					plus:tokens[i].plus.map(function (t) { return t.name }),
					minus:tokens[i].minus.map(function (t) { return t.name })
				};
				webTokens.push(webToken);
			}
			res.send({tokens:webTokens});
		}
	});
}

app.post('/karma/:token', function (req, res) {
	authenticateUser(req, res, true, function (user) {
		var vote = req.body.vote;
		if (vote !== 1 && vote !== -1) {
			res.send({status:'error'});
			return;
		}
		db.insertVote(user.name, req.params.token, vote, function () {
			res.send({status:'ok'});
		});
	});
});

app.post('/register', function (req, res) {
	if (!req.body.username) {
		res.send({error:'Username required!'});
		return;
	} else if (!req.body.password) {
		res.send({error:'Password required!'});
		return;
	}

	db.insertUser(req.body.username, req.body.password, function () {
		res.cookie('u', req.body.username, {signed:true});
		res.send(200);
	});
});

app.post('/login', function (req, res) {
	db.getUser(req.body.username, function (user) {
		if (!user || req.body.password !== user.password) {
			res.clearCookie('u');
			res.send(200);
		} else {
			res.cookie('u', req.body.username, {signed:true});
			res.send(200);
		}
	});
});

var authenticateUser = function (req, res, isAjax, callback) {
	db.getUser(req.signedCookies.u, function (user) {
		if (!user) {
			res.clearCookie('u');
			if (isAjax) {
				res.send({status:'login'});
			} else {
				res.redirect('/');
			}
		} else {
			callback(user);
		}
	});
}

app.listen(1337);
