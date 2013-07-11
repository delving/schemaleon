'use strict';

var express = require('express');
var app = express();

var data = require('../server/fake-data');

var _ = require("../app/components/underscore/underscore-min.js");

app.get('/document/:identifier', function (req, res) {
    res.setHeader('Content-Type', 'text/xml');
    res.send(data.documentXML);
});

app.get('/vocabularyFields/:vocab', function (req, res) {
    var vocab = data.vocabulary[req.params.vocab];
    if (!vocab) {
        vocab = data.vocabulary.Default;
    }
    res.json(vocab.fields);
});

app.get('/vocabulary/:vocab', function (req, res) {
    var query = req.param('q').toLowerCase();
    console.log("vocab request:" + req.params.vocab);
    var vocab = data.vocabulary[req.params.vocab];
    if (!vocab) {
        vocab = data.vocabulary.Default;
    }
    var filtered = _.filter(vocab.list, function (value) {
        return value.label.toLowerCase().indexOf(query) >= 0;
    });
    res.json(filtered);
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

module.exports = app;