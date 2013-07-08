var express = require('express');
var app = express();

var data = require('./server-data');

app.get('/document/:identifier', function (req, res) {
    res.json(data.documentTree);
});

app.get('/vocabulary/:vocab', function (req, res) {
    console.log('vocab:' + req.params.vocab + ' q:' + req.param('q'));
    res.json(data.vocabResponse);
});

app.get('/doclist', function (req, res) {
    res.json(data.docList);
});

module.exports = app;
