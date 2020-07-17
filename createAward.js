const path = require('path');
const { join, resolve } = path

var express = require('express');
var router = express.Router();

var express = require('express');
var router = express.Router();
var multiparty = require('connect-multiparty'), multipartyMiddleware = multiparty({ uploadDir: './images' });

var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');

const latex = require('node-latex');
const fs = require('fs');
//const multer = require("multer");

/*Reference - https://stackoverflow.com/questions/5649403/how-to-use-replaceall-in-javascript*/
String.prototype.replaceAll = function (stringToFind, stringToReplace) {
  if (stringToFind === stringToReplace) return this;
  var temp = this;
  var index = temp.indexOf(stringToFind);
  while (index != -1) {
    temp = temp.replace(stringToFind, stringToReplace);
    index = temp.indexOf(stringToFind);
  }
  return temp;
};

router.get('/', function (req, res, next) {
  if (req.user == undefined) {
    res.redirect('./login');
    res.end();
    return;

  }
  var context = {};
  var mysql = req.app.get('mysql');
  // mysql.pool.query("SELECT user_id, first_name, last_name, email, password, signature_image_path, DATE_FORMAT(account_created, '%m/%d/%Y') AS account_created" + 
  //  " FROM user", function (err, rows, fields) {
  mysql.pool.query("SELECT user_id, first_name, last_name, email FROM user WHERE user_type = 'USER' and user_id <> '" + req.user + "'", function (err, rows, fields) {
    if (err) {
      next(err);
      return;
    }
    context.results = rows;
    res.render('createAward', context);
  });
});

router.post('/', function (req, res, next) {
  if (req.user == undefined) {
    res.redirect('./login');
    res.end();
    return;
  }
  var mysql = req.app.get('mysql');
  var selected_user_email = [req.body.selecteduseremail];
  var awardee_username = '';
  var message = '';
  var award_type = [req.body.awardtypeoption];
  var awardee_signature = '';
  if (award_type[0] == undefined) {
    award_type = 'Weekly';
  }
  var award_created = new Date();
  var awardee_id = 0;
  var awarded_id = [req.body.selecteduserid];
  //find the user creating the award
  mysql.pool.query("SELECT user_id, first_name, last_name, signature_image_path FROM user WHERE user_id = ?", [req.user], function (err, rows, fields) {
    if (err) {
      next(err);
      return;
    }
    var curVals = rows[0];
    awardee_id = curVals.user_id;
    awardee_username = curVals.first_name + ' ' + curVals.last_name;
    awardee_signature = curVals.signature_image_path;
    mysql.pool.query('INSERT INTO `awards`(`message`,`award_type`,`award_created`,`awardee_id`,`awarded_id`) ' +
      'VALUES (?, ?, ?, ?, ?)', [message, award_type, award_created, awardee_id, awarded_id], function (err, result) {
        if (err) throw err;
        var award_id = result.insertId;
        //Read LaTex file
        console.log(award_id);
        console.log('Read LaTex file');
        var readStream = fs.createReadStream(path.join(__dirname, '/input.tex'), 'utf8');
        var input_file_data;

        readStream.on('data', function (chunk) {
          input_file_data += chunk;
        }).on('end', function () {

          console.log('Replace the text in the LaTex file and save it as the award ID');
          //Replace the text in the LaTex file and save it as the award ID
          //selectedusername
          //selecteduseremail
          //selecteduserid
          input_file_data = input_file_data.replace('undefined', ' ');
          input_file_data = input_file_data.replace('{banner_image}', '{' + path.join(__dirname, '/images/Banner.PNG') + '}');
          input_file_data = input_file_data.replace('{FirstName LastName}', '{' + [req.body.selectedusername] + '}');
          input_file_data = input_file_data.replace('{User1}', '{' + [awardee_username] + '}');
          input_file_data = input_file_data.replace('{current_date}', '{' + award_created + '}');
          input_file_data = input_file_data.replace('{award_type}', '{' + award_type + '}');
          awardee_signature = awardee_signature.replace('../static', '/public');
          awardee_signature = process.cwd() + awardee_signature;
          awardee_signature = awardee_signature.replaceAll('\\', '/');
          input_file_data = input_file_data.replace('{signature_image_path}', '{' + awardee_signature + '}');


          //wrtie the new LaTex file for the award
          console.log('write the new LaTex file for the award');
          var wstream = fs.createWriteStream(path.join(__dirname, '/awards/') + award_id + '.tex');
          wstream.write(input_file_data, function () {
            console.log('Read the LaTeX file for the award');
            const input = fs.createReadStream(path.join(__dirname, '/awards/') + award_id + '.tex');
            console.log('Create award PDF');
            const output = fs.createWriteStream(path.join(__dirname, '/awards/') + award_id + '.pdf');
            const pdf = latex(input);

            //Send award back to the response pipe
            console.log('Send award back to the response pipe');
            pdf.pipe(res);
            console.log('Send the PDF to the screen');
            pdf.pipe(output);
            console.log('File sent to screen');
            
            pdf.on('error', err => console.error(err));
            pdf.on('finish', function () {
              //email the recepient of the award
              //email PDF

              var options = {
                auth: {
                  api_user: 'ERP.cs467',
                  api_key: 'aGSmm28LoYul3ihF'
                }
              }
	      console.log('setting up email transporter');

              var transporter = nodemailer.createTransport(sgTransport(options));
	      console.log('Setting up email');
              var email = {
                from: 'do-not-reply@bestgroupatOSU.com',
                to: selected_user_email,
                subject: 'Achievement Award',
                text: 'You have received an award.',
                attachments:
                  [
                    {   // file on disk as an attachment
                      filename: 'Award.pdf',
                      path: path.join(__dirname,'/awards/') + award_id + '.pdf' // stream this file
                    }
                  ]
              };

	      console.log('Sending email');

              transporter.sendMail(email, function (error, info) {
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });
	      //console.log('ending response');
              
	      //res.end();
            });
	    console.log('Ending write stream');
            wstream.end();
                      
          });

        });
      });
  });
  //create PDF
  //create the award record and get the award ID
});

module.exports = router;
