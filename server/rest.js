'use strict';

var express = require('express');
var app = express();

var data = require('../server/fake-data');

var _ = require("../app/components/underscore/underscore-min.js");

app.get('/document/:identifier', function (req, res) {
    res.json(data.documentTree);
});

app.get('/vocabulary/:vocab', function (req, res) {
    var query = req.param('q').toLowerCase();
    var values = data.vocabulary[req.params.vocab];
    var filtered = _.filter(values, function(value) {
        return value.label.toLowerCase().indexOf(query) >= 0;
    });
    res.json(filtered);
});

app.get('/doclist', function (req, res) {
    res.json(data.docList);
});

module.exports = app;
