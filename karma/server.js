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
	})
});

app.listen(1337);