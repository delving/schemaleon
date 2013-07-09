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
                        vocabulary: {
                            name: 'PhotoTypes'
                        }
                    }
                ]
            },
            {
                name: 'Source',
                elements: [
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
                        textInput: {
                            label: 'Creation date',
                            type: 'date'
                        }
                    },
                    {
                        name: 'Type',
                        vocabulary: {
                            name: 'SourceTypes'
                        }
                    },
                    {
                        name: 'Creator',
                        doc: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.',
                        vocabulary: {
                            name: 'Actors'
                        }
                    }
                ]
            },
            {
                name: 'OtherEvent',
                multiple: true
            }
        ]
    },
    vocabulary: {
        PhotoTypes: [
            { label: 'Landscapes', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'Portraits', id: "0002", uri: "http://vocab.com/v/0002" },
            { label: 'Nudes', id: "0003", uri: "http://vocab.com/v/0003" }
        ],
        SourceTypes: [
            { label: 'Local', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'Foreign', id: "0002", uri: "http://vocab.com/v/0002" },
            { label: 'Unknown', id: "0003", uri: "http://vocab.com/v/0003" }
        ],
        Actors: [
            { label: 'Bob Marley', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'Jimi Hendrix', id: "0002", uri: "http://vocab.com/v/0002" },
            { label: 'Dan Brown', id: "0003", uri: "http://vocab.com/v/0003" }
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
