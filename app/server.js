var express = require('express');
var app = express();

var doc = {
    identifier: 'DOC123',
    name: 'Fetched Document',
    elements: [
        {
            name: 'Basics',
            elements: [
                {
                    name: 'Type',
                    localVocabulary: {
                        options: [
                            'Landscapes',
                            'Portraits',
                            'Nudes'
                        ]
                    }
                },
                {
                    name: 'Condition',
                    localVocabulary: {
                        options: [
                            'Shitty',
                            'Reasonable',
                            'Superduper'
                        ]
                    }
                }
            ]
        },
        {
            name: 'Object',
            elements: [
                { name: 'Link' },
                { name: 'MimeType' }
            ]
        },
        {
            name: 'Source',
            elements: [
                { name: 'URI' },
                { name: 'Type' },
                {
                    name: 'Note',
                    textArea: {
                        label: 'Source Note'
                    }
                }
            ]
        },
        {
            name: 'Creation',
            elements: [
                {
                    name: 'Date',
                    value: 'August 30, 2010',
                    textInput: {
                        label: 'Creation date',
                        type: 'date'
                    }
                },
                {
                    name: 'Type',
                    localVocabulary: {
                        options: [
                            'First',
                            'Second',
                            'Third'
                        ]
                    }
                },
                {
                    name: 'Creator',
                    doc: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.',
                    remoteVocabulary: {
                        source: 'http://fetch.eu',
                        elements: [
                            {
                                label: 'Fetched URI',
                                name: 'URI'
                            },
                            {
                                label: 'Literal value',
                                name: 'Literal'
                            }
                        ]
                    }
                }
            ]
        },
        {
            name: 'OtherEvent',
            multiple: true,
            elements: [
                { name: 'Link' },
                { name: 'MimeType' }
            ]
        }
    ]
};

var vocabResponse = {
    vocabulary: 'VocabName',
    candidates: [
        { label: 'One', id: "0001", uri: "http://vocab.com/v/0001" },
        { label: 'Two', id: "0002", uri: "http://vocab.com/v/0002" },
        { label: 'Three', id: "0003", uri: "http://vocab.com/v/0003" },
        { label: 'Four', id: "0004", uri: "http://vocab.com/v/0004" }
    ]
};

app.get('/document/:identifier', function (req, res) {
    res.json(doc);
});

app.get('/vocabulary/:vocab', function (req, res) {
    console.log('vocab:' + req.params.vocab + ' q:' + req.param('q'));
    res.json(vocabResponse);
});

module.exports = app;
