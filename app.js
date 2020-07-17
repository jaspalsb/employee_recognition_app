/**************************************************************
Authors: Ryan, Salwa, Jaspal
ERP GROUP CS 467
*************************************************************/
var express = require('express');
var mysql = require('./dbcon.js');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
//var expressValidator = require('express-validator');
var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});


app.engine('handlebars', handlebars.engine);
app.use(bodyParser.urlencoded({extended:true}));
//app.use(expressValidator());
app.use('/static', express.static('public'));
app.set('view engine', 'handlebars');
app.set('port', process.argv[2]);

//app.set('port', 7000);
app.set('mysql', mysql);

var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/users.js');
var bcrypt = require('bcrypt');
var saltRounds = 10;

app.use(session({ 
  secret: 'lol', 
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 24 * 30 * 100} //30 days
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

/**********************************************
home landing page here
*********************************************/
//brings up homepage
app.get('/', function(req, res){
	var counter;
	mysql.pool.query('SELECT * FROM analytics', function (error, results, fields) {
  if (error) throw error;
		var rows = JSON.parse(JSON.stringify(results[0]));
		var counter = rows.visits + 1;
		update(counter);
  // connected!
});
	function update(counter)
	{
			mysql.pool.query(('UPDATE analytics SET visits = ' + counter + ' WHERE id = 1;'), function (error, results, fields) {
  if (error) throw error;
});
	}
	res.render('landing');
});

// OTHER ROUTES HERE...
app.use('/login', require('./login.js'));
app.use('/signup', require('./signup.js'));
app.use('/userprofile', require('./userprofile.js'));
app.use('/admin-crud-users', require('./admin-crud-users.js')); 
app.use('/admin-crud-admins', require('./admin-crud-admins.js')); 
app.use('/awardHistory', require('./awardHistory.js'));
app.use('/createAward', require('./createAward.js'));
app.use('/logout', require('./logout.js'));
app.use('/forgotpassword', require('./forgotPassword.js'));
app.use('/admin-account', require('./admin-account.js'));
app.use('/admin-bus-intel', require('./admin-bus-intel.js'));
/*************************************************************************
Passport strats
*************************************************************************/
//passport documentation on configuring strategy http://www.passportjs.org/packages/passport-local/
passport.use(new LocalStrategy(
	{usernameField: 'email',
	},
	function(username, password, done){
		User.findOne({
			where: {email: username}
		}).then(function(user){
			if(!user){
				//console.log("wrong username");
				return done(null, false, {message: 'Username is incorrect'});
			}
			if (user){
				//console.log("wrong password");
				bcrypt.compare(password, user.password, function(err, res) {
    			// res == true
				//now check if res is true if not then do not 
				if(!res)
					{
						console.log("false");
						return done(null, false, {message: 'Password is incorrect'});
					}
				if(res)
					{
						console.log("correct");
						return done(null, user, {message: 'logged in'});
					}
				});
			}
		}).catch(err => done(err));
	}));


//now to serialize user and deserialize user for sessions

passport.serializeUser(function(user, done){
	done(null, user.user_id);
});


passport.deserializeUser(function(user, done){
	done(null, user);
});

/****************************************
middleware that will auth
************************************/

//logout 
/*app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
})*/

//check if loggedIn 
function loggedIn(req, res, next){
	if (req.isAuthenticated()){
		next();
	}
	else{
		res.redirect('/');
	}
}
/**************************
End middleware code
***************************/

//app.listen(3000, function(){
  //  console.log("server started");
//})

/* app.use(function(req,res){
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next) {npm
    console.error(err.stack);
    res.status(500);
    res.render('500');
}); */

app.listen(app.get('port'), function() {
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});


