/**
 * Created by JiSoo on 2016-09-28.
 */

var config = require('./config');
var mysql = require('promise-mysql');
var pool = mysql.createPool({
    host: 'localhost',
    user: 'ambauser',
    password: 'ambapass',
    database: 'amba',
    connectionLimit: 20
});

module.exports = pool;