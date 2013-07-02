var CultureCollectorApp = angular.module('CultureCollectorApp');

var doc = {
    identifier: 'DOC123',
    name: 'Document',
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
                                name: 'URI',
                                value: 'this was fetched'
                            },
                            {
                                label: 'Literal value',
                                name: 'Literal',
                                value: 'this accompanied the result'
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

CultureCollectorApp.service("Docs", function () {
    this.query = function () {
        return doc;
    };
});


var docList = [
        {
            identifier: 'Item123',
            appellation: 'Lorem ipsum',
            status: 'incomplete'
        },
        {
            identifier: 'Item234',
            appellation: 'Lorem updown',
            status: 'complete'
        },
        {
            identifier: 'Item345',
            appellation: 'Solor delar sammit',
            status: 'incomplete'
        },
        {
            identifier: 'Item456',
            appellation: 'Objectus in a rowus',
            status: 'complete'
        },
        {
            identifier: 'Item567',
            appellation: 'Imus objectus',
            status: 'complete'
        },
        {
            identifier: 'Item678',
            appellation: 'Globule module listus',
            status: 'incomplete'
        },
        {
            identifier: 'Item789',
            appellation: 'Lipsum sapsum drapsum',
            status: 'incomplete'
        }

    ];

CultureCollectorApp.service("ObjectList", function () {
    this.query = function () {
        return docList;
    };
});