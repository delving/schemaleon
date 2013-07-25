'use strict';

var _ = require("underscore");
var express = require('express');
var storage = require('./storage');
var app = express();
app.use(express.bodyParser());
storage.useDatabase('oscr', function (name) {
    console.log('Yes we have ' + name);
});
var data = require('./fake-data'); // todo: remove eventually

function replyWithLanguage(lang, res) {
    storage.getLanguage(lang, function (language) {
        res.setHeader('Content-Type', 'text/xml');
        res.send(language);
    });
}

app.get('/i18n/:lang', function (req, res) {
    replyWithLanguage(req.params.lang, res);
});

app.post('/i18n/:lang/element', function (req, res) {
    var lang = req.params.lang;
    var key = req.body.key;
    if (key) {
        if (req.body.title) storage.setElementTitle(lang, key, req.body.title, function (ok) {
            replyWithLanguage(lang, res);
        });
        if (req.body.doc) storage.setElementDoc(lang, key, req.body.doc, function (ok) {
            replyWithLanguage(lang, res);
        });
    }
});

function vocab(req) {
    var vocab = data.vocabulary[req.params.vocab];
    if (!vocab) {
        vocab = data.vocabulary.Default;
    }
    return vocab;
}

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
