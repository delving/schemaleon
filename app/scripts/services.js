var module = angular.module('CultureCollectorApp');

var doc = {
    identifier: 'DOC123',
    name: 'Document',
    elements: [
        {
            name: 'Basics',
            elements: [
                {
                    name: 'Type',
                    controlled: [
                        'Landscapes',
                        'Portraits',
                        'Nudes'
                    ]
                },
                {
                    name: 'Condition',
                    controlled: [
                        'Shitty',
                        'Reasonable',
                        'Superduper'
                    ]
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
                    controlled: [
                        'First',
                        'Second',
                        'Third'
                    ]
                },
                {
                    name: 'Creator',
                    doc: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.',
                    fetch: {
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

module.service("Docs", function() {
    this.query = function() {
        return doc;
    };
});