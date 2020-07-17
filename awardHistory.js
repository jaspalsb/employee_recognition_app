module.exports = function(){
    	var express = require('express');
    	var router = express.Router();
	
//check if loggedIn
function loggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		next();
	} else {
		res.redirect('/login');
	}
}
//router.get('/', function(req, res){
	//var context = {};
    //res.render('awardHistory', context);
//});

router.get('/', loggedIn, function (req, res, next) {
	if(req.user == undefined){
		res.redirect('./login');
		res.end();
    return;
  }
    var mysql = req.app.get('mysql');
    var awardee_id = 0;
    //find the user creating the award
    mysql.pool.query("SELECT user_id, first_name, last_name FROM user WHERE user_id = ?",[req.user], function (err, rows, fields) {
      if (err) {
          next(err);
          return;
      }
      var curVals = rows[0];
      awardee_id = curVals.user_id;

      var context = {};
      var mysql = req.app.get('mysql');
     // mysql.pool.query("SELECT user_id, first_name, last_name, email, password, signature_image_path, DATE_FORMAT(account_created, '%m/%d/%Y') AS account_created" + 
        //  " FROM user", function (err, rows, fields) {
     //mysql.pool.query('INSERT INTO `era`.`awards`(`message`,`award_type`,`award_created`,`awardee_id`,`awarded_id`) ' + 
         mysql.pool.query("SELECT awards.award_id, awards.award_type, awards.award_created, awardee.first_name, awardee.last_name, awarded.first_name, awarded.last_name FROM awards INNER JOIN  user as awardee ON awards.awardee_id = awardee.user_id INNER JOIN user as awarded ON awards.awarded_id = awarded.user_id where awardee.user_id = ?",awardee_id , function (err, rows, fields) {
        //  mysql.pool.query("SELECT awards.award_id, awards.award_type, awards.awarded.first_name, awards.awarded.last_name FROM awards where awardee.user_id = ?",awardee_id , function (err, rows, fields) {
        if (err) {
              next(err);
              return;
          }
         context.results = rows;
         res.render('awardHistory', context);

  });   
});
});


  router.delete('/:id', function (req, res, next) {
    var context = {};
    var mysql = req.app.get('mysql');
   // mysql.pool.query("SELECT user_id, first_name, last_name, email, password, signature_image_path, DATE_FORMAT(account_created, '%m/%d/%Y') AS account_created" + 
      //  " FROM user", function (err, rows, fields) {
        mysql.pool.query("DELETE FROM awards Where award_id = ?", req.params.id , function (err, rows, fields) {
        	if(err){
            res.write(JSON.stringify(error));
            res.status(400);
            res.end();
          }
          else{
            //res.status(202).end();
            //return res.redirect('/awardHistory');
            //res.redirect('back');
            res.status(202).end();
          }
        });
      });
    
return router;
} ();