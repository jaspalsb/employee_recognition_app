module.exports = function(){
	var express = require('express');
	var router = express.Router();
	var bcrypt = require('bcrypt');
	var saltRounds = 10;
	// SQL QUERIES

	// pulls the department data from db
	function getDepartments(res, mysql, context, complete){
		mysql.pool.query('SELECT dept_id, dept_name FROM department', 
			function(error, results, fields){
				if(error){
					res.write(JSON.stringify(error));
					res.end();
				}
				context.department = results;

				complete();
			});
	};

	// pulls all the user data from db
	function getUsers(res, mysql, context, complete){
		mysql.pool.query('SELECT user_id, first_name, last_name, user.email, user.password, department.dept_id, department.dept_name, account_created FROM `user` LEFT JOIN `department` ON user.department_id = department.dept_id WHERE user.user_type = "USER"', function(error, results, fields){

			if(error){
				res.write(JSON.stringify(error));
				res.end();
			}
			context.users = results;
			complete();
		});
	};

	// pulls user data from db for 1 user
	function getUser(res, mysql, context, id, complete){

		var sql = 'SELECT user_id, first_name, last_name, email, password, department_id, account_created, signature_image_path FROM user WHERE user_id = ?'
		var inserts = [id];
		mysql.pool.query(sql, inserts, function(error, results, fields){
			if(error){
				res.write(JSON.stringify(error));
				res.end();
			}
			context.user = results[0];
			complete();
		});
	};

	// gets page for crud-users
	router.get('/', function(req, res){

		// check to ensure user is logged in...
		if(req.user == undefined){
			res.redirect('./login');
			res.end();
	        return;
	    }

		var callBackCount = 0;
		var context = {};
		context.jsscripts = ['delete_user.js'];

		// CALLBACK TO FUNCTS FOR SQL
		var mysql = req.app.get('mysql');
		getDepartments(res, mysql, context, complete);
		getUsers(res, mysql, context, complete);

		function complete(){
			callBackCount++;
			if(callBackCount >= 2){
				res.render('admin-crud-users.handlebars', context);
			}
		};

	});

	var create_user_sql = function(req, res, next){

		var mysql = req.app.get('mysql');

		// specify that it is standard user account
		req.body.user_type = 'USER';

		// sig file cannot be uploaded by admin
		req.body.signature_image_path = 'NONE';
	bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
		var sql = 'INSERT INTO user (first_name, last_name, email, password, department_id, user_type, signature_image_path) VALUES (?,?,?,?,?,?,?)';
		var inserts = [req.body.first_name, req.body.last_name, req.body.email, hash, req.body.department_id, req.body.user_type, req.body.signature_image_path];
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

	// create a user
	router.post('/', create_user_sql, function(req, res, next){

		// check to ensure user is logged in...
		if(req.user == undefined){
			res.redirect('./login');
			res.end();
	        return;
	    }

		// call to mysql db to create user middleware
		req.create_user_sql;

		res.redirect('/admin-crud-users');

	});

	// deletes a user
	router.delete('/:id', function(req, res){

		// check to ensure user is logged in...
		if(req.user == undefined){
			res.redirect('./login');
			res.end();
	        return;
	    }

		var mysql = req.app.get('mysql');
		var sql = 'DELETE FROM user WHERE user_id=?';
		var inserts = [req.params.id];
		sql = mysql.pool.query(sql, inserts, function(error, results, fields){
			if(error){
				res.write(JSON.stringify(error));
				res.status(400);
				res.end();
			}
			else{
				res.status(202).end();
			}
		});
	});

	// update user page
	router.get('/:id', function(req, res){

		// check to ensure user is logged in...
		if(req.user == undefined){
			res.redirect('./login');
			res.end();
	        return;
	    }

		callBackCount = 0;
		var context = {};
		context.jsscripts = ['select_dept.js', 'update_user.js'];
		var mysql = req.app.get('mysql');
		getUser(res, mysql, context, req.params.id, complete);
		getDepartments(res, mysql, context, complete);
		function complete(){
			callBackCount++;
			if(callBackCount >= 2){
				res.render('update_user.handlebars', context);
			};
		};
	});

	router.post('/:id', function(req, res){

		// check to ensure user is logged in...
		if(req.user == undefined){
			res.redirect('./login');
			res.end();
	        return;
	    }

		var mysql = req.app.get('mysql');
		var inserts = [];
		req.body.signature_image_path = 'NONE';
		var str_password = String(req.body.password);
		bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
		if (str_password.substring(0, 7) == '$2b$10$') {
		inserts = [req.body.first_name, req.body.last_name, req.body.email, req.body.department_id, req.params.id];
		sql = 'UPDATE user SET first_name=?, last_name=?, email=?, department_id=? WHERE user_id=?';

		sql = mysql.pool.query(sql, inserts, function(error, results, fields){
			if(error){
				res.write(JSON.stringify(error));
				res.end();
			}
			else{
				res.status(200);
				res.redirect('/admin-crud-users');
			}
		});
		}
		else{
		inserts = [req.body.first_name, req.body.last_name, req.body.email, hash, req.body.department_id, req.params.id];
		sql = 'UPDATE user SET first_name=?, last_name=?, email=?, password=?, department_id=? WHERE user_id=?';

		sql = mysql.pool.query(sql, inserts, function(error, results, fields){
			if(error){
				res.write(JSON.stringify(error));
				res.end();
			}
			else{
				res.status(200);
				res.redirect('/admin-crud-users');
			}
		});
		}
		});
	});

	// error handling
	router.use(function(err, req, res, next){
		res.status(err.httpStatusCode);
		res.send(err.message);
	});

	return router;

}();