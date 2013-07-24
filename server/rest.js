'use strict';

var express = require('express');
var app = express();

app.use(express.bodyParser());

var data = require('../server/fake-data');

var _ = require("../app/components/underscore/underscore-min.js");

function getLangStrings(req) {
    var lang = req.params.lang;
    if (!data.i18n[lang]) {
        data.i18n[lang] = { element: {}, label: {} };
    }
    return data.i18n[lang];
}

function getLangElement(req) {
    var langStrings = getLangStrings(req);
    var key = req.body.key;
    if (!langStrings.element[key]) {
        langStrings.element[key] = {};
    }
    return langStrings.element[key];
}

function setElementLang(req) {
    if (req.body.key) {
        if (req.body.title) getLangElement(req).title = req.body.title;
        if (req.body.doc) getLangElement(req).doc = req.body.doc;
    }
    return getLangStrings(req);
}

function vocab(req) {
    var vocab = data.vocabulary[req.params.vocab];
    if (!vocab) {
        vocab = data.vocabulary.Default;
    }
    return vocab;
}

// ==============

app.get('/i18n/:lang', function (req, res) {
    res.json(getLangStrings(req));
});

app.post('/i18n/:lang/element', function (req, res) {
    res.json(setElementLang(req));
});

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
    if (filtered.length == 0) {
        filtered = v.list;
    }
    res.json(filtered);
});

app.post('/vocabulary/:vocab/add', function (req, res) {
    var v = vocab(req);
    v.list.push(req.body.Entry);
    res.json(v);
});

app.get('/document/:identifier', function (req, res) {
    res.setHeader('Content-Type', 'text/xml');
    res.send(data.documentXML);
});

app.post('/document/:identifier', function (req, res) {
});

app.get('/document', function (req, res) {
    res.json(data.docList);
});

module.exports = app;
