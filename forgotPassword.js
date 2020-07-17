var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('./models/users.js');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var crypto = require('crypto');
var bcrypt = require('bcrypt');
var saltRounds = 10;
function loggedIn(req, res, next){
	if (req.isAuthenticated()){
		next();
	}
	else{
		res.redirect('/');
	}
}

router.get('/', function(req, res){
	var context = {};
	context.resetError = req.session.resetErr;
	//end any sessions if on the forgot password route
	req.session.destroy();
	res.render('forgotPassword', context);
});

router.post('/', function(req, res){
	
	//first thing that I need to do is check if the users email exists in the database
	//Easily done with the user model using sequelize
	var emailpassed = req.body.email;
	
		User.findOne({
			where: {email: emailpassed}
		}).then(user => {
			if(!user){
				var context = {};
				context.error = 'Error';
          		res.render('forgotPassword', context);
			}
			else{
				var context = {};
					context.sent = user.get('email');
				//https://stackoverflow.com/questions/8855687/secure-random-token-in-node-js
				//random token generator
				var token = crypto.randomBytes(16).toString('hex');
				var get_user_id = user.get('user_id');
				User.sequelize.query('UPDATE `user` SET user_token = ' + '\''+ token + '\'' + ', reset_timer = ADDTIME(NOW(), \'00:15:00\') WHERE `user_id` = ' + get_user_id, {type: User.sequelize.QueryTypes.UPDATE}).then(users => {});
				var options = {
    				auth: {
       				api_user: 'add credentials here',
    				api_key: 'add credentials here'
 						}
				}

				var client = nodemailer.createTransport(sgTransport(options));
					var email = {
 					from: 'do-not-reply@bestgroupatOSU.com',
  					to: req.body.email,
  					subject: 'Password reset requested',
  					text: 'As requested, click on the link to reset your password ' +
	 				'http://' + req.headers.host + '/forgotpassword/reset/password/' + token + '\n This link will remain active for the next 15 minutes'
					};

					client.sendMail(email, function(err, info){
   					 if (err ){
     				 console.log(err);
   						 }
    				else {
      					res.render('forgotPassword', context);
    				}
					});
			}
		});
});

/*router.get('/test', function(req, res){
	User.findOne({
		where: {email: 'jbainiwal@gmail.com'}
	}).then(user => {
		var justtest = user.get('user_id');
		User.sequelize.query('SELECT * FROM `user` WHERE `user_id` = ' + justtest, {type: User.sequelize.QueryTypes.SELECT}).then(users => {console.log(users);});
	});
	res.send("just a test");
});*/

router.get('/reset/password/:token', function(req, res){
	User.findOne({
			where: {user_token: req.params.token}
		}).then(user => {
		if (user)
			{
				//create the time stamp of the current time this route is accessed built in object
				var d = new Date();
				//make date to iso format
				d.toISOString();
				if ((user.reset_timer) > d ){
					var context = {};
					context.token = req.params.token;
					res.render('resetpassword', context);
				}
				else
					{
						req.session.resetErr = "error";
						res.redirect('/forgotpassword');
					}
			}
		if(!user)
			{
				req.session.resetErr = "error";
				res.redirect('/forgotpassword');
			}
	});
});

router.post('/reset/password/:token', function(req, res){
	User.findOne({
			where: {user_token: req.params.token}
		}).then(user => {
		if (user)
			{
				//create the time stamp of the current time this route is accessed built in object
				var d = new Date();
				//make date to iso format
				d.toISOString();
				if ((user.reset_timer) > d ){
					//now we need to also check if the passwords entered match
					if (req.body.confirmPass == req.body.password)
						{
							bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
							//now we can update
							User.sequelize.query('UPDATE `user` SET password =' + '\'' + hash + '\'' + ' WHERE `user_id` = ' + user.user_id, {type: User.sequelize.QueryTypes.UPDATE}).then(users => {});
							});
							//now make user token and reset timer back to NULL since password is updated
							user.user_token = null;
							user.reset_timer = null;
							user.save(['user_token', 'reset_timer']);
							res.redirect('/login');
						}
					else
						{
							var context = {};
							context.error = " ";
							res.render('resetpassword', context);
						}
				}
				else
					{
						req.session.resetErr = "error";
						res.redirect('/forgotpassword');
					}
			}
		if(!user)
			{
				req.session.resetErr = "error";
				res.redirect('/forgotpassword');
			}
	});
});
module.exports = router;