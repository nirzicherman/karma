var express = require('express');
var app = express();
var db = require('./db.js');

app.use(express.cookieParser('thisIStheSecret0fExpreSS'));

app.use(express.bodyParser());

app.engine('.html', require('ejs').renderFile);

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