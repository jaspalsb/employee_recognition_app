var express = require('express');
var router = express.Router();
var session = require('express-session');
var passport = require('passport');
var User = require('./models/users.js');
var bcrypt = require('bcrypt');
var saltRounds = 10;

router.get('/', loggedIn, function(req, res){
	res.render('login', {error: req.flash('error')});
});

router.post('/', passport.authenticate('local', {
	successRedirect: '/userprofile',
    failureRedirect: '/login',
	failureFlash: true
}), function(req, res){
	
});

//middleware
function loggedIn(req, res, next){
    if(req.isAuthenticated()){
        res.redirect('/userprofile');
		return;
    }
    next();
}
module.exports = router;