'use strict';

var express = require('express');
var app = express();

app.use(express.bodyParser());

var data = require('../server/fake-data');

var _ = require("../app/components/underscore/underscore-min.js");

app.get('/document/:identifier', function (req, res) {
    res.setHeader('Content-Type', 'text/xml');
    res.send(data.documentXML);
});

app.get('/doclist', function (req, res) {
    res.json(data.docList);
});

app.get('/i18n/:lang', function (req, res) {
    var lang = req.params.lang;
    var strings = data.i18n[lang];
    if (strings) {
        res.json(strings);
    }
    else {
        res.json({});
    }
});

var vocab = function(req) {
    var vocab = data.vocabulary[req.params.vocab];
    if (!vocab) {
        vocab = data.vocabulary.Default;
    }
    return vocab;
};

app.get('/vocabulary/:vocab', function (req, res) {
    res.json(vocab(req));
});

app.get('/vocabulary/:vocab/select', function (req, res) {
    var query = req.param('q').toLowerCase();
    var v = vocab(req);
    var filtered = _.filter(v.list, function (value) {
        // todo: Label should not be known
        return value.Label.toLowerCase().indexOf(query) >= 0;
    });
    if (filtered.length  == 0) {
        filtered = v.list;
    }
    res.json(filtered);
});

app.post('/vocabulary/:vocab/add', function (req, res) {
    var v = vocab(req);
    v.list.push(req.body.Entry);
    res.json(v);
});

module.exports = app;
