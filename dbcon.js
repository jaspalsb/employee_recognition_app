var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit: 10,
    host: 'add credentials here',
	port: '3306',
	//socketPath: '/var/run/mysqld/mysqld.sock',
    user: 'add credentials here',
    password: 'add credentials here',
    database: 'add credentials here',
    dateStrings: true
});

module.exports.pool = pool;


