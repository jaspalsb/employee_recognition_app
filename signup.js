var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({ dest: 'signatures' });
var fs = require('fs');
var sys = require('util');
var bcrypt = require('bcrypt');
var User = require('./models/users.js');
var saltRounds = 10;

router.get('/', function(req, res) {
	var callBackCount = 0;
	var context = {};
	// CALLBACK TO FUNCTS FOR SQL
	var mysql = req.app.get('mysql');
	getDepartments(res, mysql, context, complete);

	function complete() {
		callBackCount++;
		if (callBackCount >= 1) {
			context.error = req.session.resetErr;
			req.session.destroy();
			//end any sessions if on the forgot password route
			res.render('signup', context);
		}
	}
});

router.post('/', function(req, res, next) {
	if (req.body.first_name == '') {
		req.session.resetErr = 'First name not provided';
		//context.error = "text";
		//		res.render('signup', context);
		res.redirect('/signup');
		return;
	} else if (req.body.last_name == '') {
		req.session.resetErr = 'Last name not provided';
		res.redirect('/signup');
		return;
	} else if (req.body.email == '') {
		req.session.resetErr = 'Email not provided';
		res.redirect('/signup');
		return;
	} else if (req.body.password == '') {
		req.session.resetErr = 'invalid password';
		res.redirect('/signup');
		return;
	} else if (req.body.confirmpassword == '') {
		req.session.resetErr = 'invalid password';
		res.redirect('/signup');
		return;
	} else if (req.body.password != req.body.confirmpassword) {
		req.session.resetErr = 'Passwords do not match';
		res.redirect('/signup');
		return;
	}
	User.findOne({
		where: { email: req.body.email }
	}).then(user => {
		if (user) {
			req.session.resetErr = 'Email already exists';
			res.redirect('/signup');
			return;
		}
		if (!user) {
			var mysql = req.app.get('mysql');

			// specify that it is standard user account
			req.body.user_type = 'USER';
			bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
				// Store hash in your password DB.
				var sql =
					'INSERT INTO user (first_name, last_name, email, password, department_id, user_type, signature_image_path) VALUES (?,?,?,?,?,?,?)';
				var inserts = [
					req.body.first_name,
					req.body.last_name,
					req.body.email,
					hash,
					req.body.department_id,
					req.body.user_type,
					1
				];
				sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
					if (error) {
						console.log(JSON.stringify(error));
						res.write(JSON.stringify(error));
						res.end();
					} else {
						next();
					}
				});
			});
			context = {};
			context.first = req.body.first_name;
			context.last = req.body.last_name;
			context.email = req.body.email;
			res.render('draw', context);
		}
	});
});
// pulls the department data from db
function getDepartments(res, mysql, context, complete) {
	mysql.pool.query('SELECT dept_id, dept_name FROM department', function(error, results, fields) {
		if (error) {
			res.write(JSON.stringify(error));
			res.end();
		}
		context.department = results;

		complete();
	});
}

router.post('/signature', function(req, res){
	User.findOne({
		where: { email: req.body.email }
	}).then(user => {
		var image = req.body.imgBase64;
	var data = image.replace(/^data:image\/\w+;base64,/, "");
	var buf = new Buffer.from(data, 'base64');
	var sig_path = './public/signatures/' + user.user_id + '.png';
	var save_path = '../static/signatures/' + user.user_id + '.png';
	fs.writeFile(sig_path, buf, 'base64', err => {
      if (err) throw err;
    });
	User.sequelize.query('UPDATE `user` SET signature_image_path =' + '\'' + save_path + '\''+ ' WHERE `user_id` = ' + user.user_id, {type: User.sequelize.QueryTypes.UPDATE}).then(users => {});
	});
	
	return res.status(200).send({result: 'redirect', url:'/login'});
});

module.exports = router;
/*
	var create_user_sql = function(req, res, next){

		var mysql = req.app.get('mysql');

		// specify that it is standard user account
		req.body.user_type = 'USER';
		bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
  		// Store hash in your password DB.
		var sql = 'INSERT INTO user (first_name, last_name, email, password, department_id, user_type, signature_image_path) VALUES (?,?,?,?,?,?,?)';
		var inserts = [req.body.first_name, req.body.last_name, req.body.email, hash, req.body.department_id, req.body.user_type, 1];
		sql = mysql.pool.query(sql, inserts, function(error, results, fields){
			if(error){
				console.log(JSON.stringify(error));
				res.write(JSON.stringify(error));
				res.end();
			}else{
				next();
			}
		});
		});
	}
	*/
/*
	router.post('/', function(req, res){
		var data = JSON.parse(req.body.data);
		var object = {};
		for (let key in data)
			{

				var obj = data[key];
				object[obj["name"]] = obj["value"];
				//console.log(obj["name"]);
			}
		console.log(object);
		console.log(object.first_name);
		var flag = 1;
		if ((object.first_name) == ''){
			flag = 0;
			req.session.resetErr = "First name not provided";
			res.redirect('/');
			}
		if ((object.last_name) == '')
			{
				flag = 0;
				req.session.resetErr = "Last name not provided";
				res.redirect('/signup');
			}
		if ((object.email) == '')
			{
				flag = 0;
				req.session.resetErr = "Email not provided"
			}
		if ((object.password) != (object.confirmpassword))
			{
				flag = 0;
				req.session.resetErr = "Passwords do not match";
			}
		if (flag == 1)
			{
		var image = req.body.imgBase64;
		var data = image.replace(/^data:image\/\w+;base64,/, "");
		var buf = new Buffer.from(data, 'base64');
		fs.writeFile('./signatures/test.png', buf, 'base64', err => {
		  if (err) throw err;
		});
		// upload signature
		req.signature_upload;

		// call to mysql db to create user middleware
		req.create_user_sql;
			}
		//res.redirect('/admin-crud-users');

	});
*/