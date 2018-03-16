var express = require('express');
var mysql = require('mysql');

var app = express();

app.set('port', process.env.PORT || 5555);

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'test'
});

connection.connect();

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.get('/query', function(req, res) {
  console.log(req.query.querykey);
  connection.query(req.query.querykey, function(err, rows, fields) {
    if (err) {
      console.log(err.stack);
      res.json({result: 'error'});
    } else {
      res.json(rows);
    }
  });
});

app.get('/select', function(req, res) {
  console.log(req.query.type);
  var querystr = 'select * from '+req.query.type;
  connection.query(querystr, function(err, rows, fields) {
    if (err) {
      console.log(err.stack);
      res.json({result: 'error'});
    } else {
      res.json(rows);
    }
  });
});
app.get('*.js', function(req, res) {
  res.sendFile(__dirname + req.url);
});
app.get('*.css', function(req, res) {
  res.sendFile(__dirname + req.url);
});
app.use(function(req, res) {
  res.status('404');
  res.json({result: 'page not found!'});
});

app.use(function(err, req, res, next) {
  console.log(err.stack);
  res.status(500);
  res.json({result: 'server internal error'});
});

app.listen(app.get('port'), function() {
  console.log('Express started on http://localhost:' + app.get('port'), 'press ctrl-c to terminate.');
});
