'use strict';

module.exports = {
    documentTree: {
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
                            vocabularyName: 'vocabby',
                            elements: [
                                {
                                    label: 'Label',
                                    name: 'label'
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
    },
    vocabResponse: {
        vocabulary: 'VocabName',
        candidates: [
            { label: 'One', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'Two', id: "0002", uri: "http://vocab.com/v/0002" },
            { label: 'Three', id: "0003", uri: "http://vocab.com/v/0003" },
            { label: 'Four', id: "0004", uri: "http://vocab.com/v/0004" }
        ]
    },
    docList: [
        {
            identifier: 'Item123',
            appellation: 'Lorem rips -em',
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
    ]
};
