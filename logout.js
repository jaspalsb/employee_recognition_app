module.exports = function(){
    	var express = require('express');
    	var router = express.Router();
	
router.get('/', function(req, res){
	//var context = {};
	//	res.render('logout', context);
	req.logout();
	if (req.session) {
        req.session.destroy(function(err) {
            if (err) return console.log(err);
			return res.redirect('/');
        });
    }
});

return router;
} ();