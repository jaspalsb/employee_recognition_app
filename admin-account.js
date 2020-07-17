  module.exports = function(){
	var express = require('express');
	var router = express.Router();

	// SQL QUERIES

	// pulls user data from db for 1 user
	function getUser(res, mysql, context, email, complete){

		var sql = 'SELECT user_id, first_name, last_name, email, password, department_id, account_created, signature_image_path FROM user WHERE user_id = ?'
		var inserts = [email];
		mysql.pool.query(sql, inserts, function(error, results, fields){
			if(error){
				res.write(JSON.stringify(error));
				res.end();
			}
			context.user = results[0];
			complete();
		});
	};

	// gets page for account
	router.get('/', function(req, res){

		// check to ensure user is logged in...
		if(req.user == undefined){
			res.redirect('./login');
			res.end();
	        return;
	    }

		var callBackCount = 0;
		var context = {};

		// CALLBACK TO FUNCTS FOR SQL
		var mysql = req.app.get('mysql');
		getUser(res, mysql, context, req.user, complete);

		function complete(){
			callBackCount++;
			if(callBackCount >= 1){
				res.render('admin-account.handlebars', context);
			}
		};
	});
	
	return router;
}();