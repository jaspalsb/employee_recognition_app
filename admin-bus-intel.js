module.exports = function(){
	var express = require('express');
	var router = express.Router();
	var json2csv = require('json2csv').parse;
	// SQL Queries

	// query num of awards
	function getAwardNum(res, mysql, context, complete){
		mysql.pool.query('SELECT count(*) AS total_awards FROM awards', 
			function(error, results, fields){
				if(error){
					res.write(JSON.stringify(error));
					res.end();
				}
				context.award_num = results[0];

				complete();
			});
	};

	// query num of awardees
	function getAwardeeNum(res, mysql, context, complete){
		mysql.pool.query('SELECT DISTINCT count(awardee_id) AS total_awardees FROM awards',
			function(error, results, fields){
				if(error){
					res.write(JSON.stringify(error));
					res.end();
				}
				context.awardee_num = results[0];

				complete();
			});
	};
	
	function getVisitsNum(res, mysql, context, complete){
		mysql.pool.query('SELECT visits FROM analytics',
			function(error, results, fields){
				if(error){
					res.write(JSON.stringify(error));
					res.end();
				}
				context.sitevisits = results[0];

				complete();
			});
	};

	// query to get num of awards per department
	function getAwardsPerDept(res,mysql, context, complete){
		mysql.pool.query('SELECT count(user.department_id) AS dept_total, department.dept_name FROM awards LEFT JOIN user ON awards.awardee_id = user.user_id LEFT JOIN department ON user.department_id = department.dept_id GROUP BY department.dept_name', 
			function(error, results, fields){
				if(error){
					res.write(JSON.stringify(error));
					res.end();
				}
				context.num_awards_dept = results;

				complete();
			});
	};
	//top awarded users
	function getAwardsByPerson(res,mysql, context, complete){
		mysql.pool.query('select user_id, count(user_id) AS counter, first_name, last_name FROM awards LEFT JOIN user ON awards.awarded_id = user.user_ID GROUP BY user_id LIMIT 3', 
			function(error, results, fields){
				if(error){
					res.write(JSON.stringify(error));
					res.end();
				}
				//context.num_awards_dept = results;
				context.persons = results;

				complete();
			});
	};

	// routes
	router.get('/', function(req, res){

		// check to ensure user is logged in...
		if(req.user == undefined){
			res.redirect('./login');
			res.end();
	        return;
	    }
	    
		var callBackCount = 0;
		var context = {};
		context.jsscripts = [];

		context.googlechart = 'https://www.gstatic.com/charts/loader.js';

		// TESTING
		console.log(context.googlecharts);

		// callback to sql queries
		var mysql = req.app.get('mysql');
		getAwardNum(res, mysql, context, complete);
		getAwardeeNum(res, mysql, context, complete);
		getAwardsPerDept(res, mysql, context, complete);
		getVisitsNum(res, mysql, context, complete);
		getAwardsByPerson(res, mysql, context, complete);
		function complete(){
			callBackCount++;
			if(callBackCount >= 5){
				res.render('admin-bus-intel.handlebars', context);
			}
		};
	});

	//exporting a csv file
	router.get('/download/users', function(req, res){
		var mysql = req.app.get('mysql');
		mysql.pool.query('SELECT user_id, email, first_name, last_name, account_created FROM user;', 
			function(error, results, fields){
				if(error){
					res.write(JSON.stringify(error));
					res.end();
				}
			res.setHeader('Content-disposition', 'attachment; filename=user.csv');
  			res.set('Content-Type', 'text/csv');
			var field = ['user_id', 'email', 'first_name', 'last_name', 'account_created'];
				const csv = json2csv(results, fields)
				res.status(200).send(csv);
			});
	});
	
	router.get('/download/awardees', function(req, res){
		var mysql = req.app.get('mysql');
		mysql.pool.query('SELECT first_name, last_name, email FROM awards INNER JOIN user ON user.user_id = awards.awardee_id;', 
			function(error, results, fields){
				if(error){
					res.write(JSON.stringify(error));
					res.end();
				}
			res.setHeader('Content-disposition', 'attachment; filename=awardee.csv');
  			res.set('Content-Type', 'text/csv');
			var field = ['first_name', 'last_name', 'email'];
				const csv = json2csv(results, fields)
				res.status(200).send(csv);
			});
	});
	
	router.get('/download/departments', function(req, res){
		var mysql = req.app.get('mysql');
		mysql.pool.query('SELECT first_name, last_name, email, dept_name FROM user JOIN department ON user.department_id = department.dept_id;', 
			function(error, results, fields){
				if(error){
					res.write(JSON.stringify(error));
					res.end();
				}
			res.setHeader('Content-disposition', 'attachment; filename=dept.csv');
  			res.set('Content-Type', 'text/csv');
			var field = ['first_name', 'last_name', 'email', 'dept_name'];
				const csv = json2csv(results, fields)
				res.status(200).send(csv);
			});
	});
	// error handling
	router.use(function(err, req, res, next){
		res.status(err.httpStatusCode);
		res.send(err.message);
	});

	return router;
}();