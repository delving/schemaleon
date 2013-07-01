var express = require('express');
var app = express();

//app.get('/', function(req, res) {
//    res.send('welcome to the api');
//});
//
app.get('/hello/:name', function(req, res) {
  res.send('hey there! ' + req.params.name);
});

module.exports = app;
