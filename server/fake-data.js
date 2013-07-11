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
        PhotoType: {
            fields: [
                { name: 'label', title: "Label"},
                { name: 'id', title: "Identifier" },
                { name: 'uri', title: "URI"}
            ],
            list: [
                { label: 'Landscapes', id: "a", uri: "http://vocab.com/v/0001" },
                { label: 'Portraits', id: "b", uri: "http://vocab.com/v/0002" },
                { label: 'Nudes', id: "c", uri: "http://vocab.com/v/0003" }
            ]
        },
        SourceType: {
            fields: [
                { name: 'label', title: "Label"},
                { name: 'id', title: "Identifier" }
            ],
            list: [
                { label: 'Local', id: "1" },
                { label: 'Foreign', id: "2" },
                { label: 'Unknown', id: "3" }
            ]
        },
        Actor: {
            fields: [
                { name: 'label', title: "Label"},
                { name: 'id', title: "Identifier" }
            ],
            list: [
                { label: 'Bob Marley', id: "1" },
                { label: 'Jimi Hendrix', id: "2" },
                { label: 'Dan Brown', id: "3" }
            ]
        },
        Place: {
            fields: [
                { name: 'label', title: "Label"},
                { name: 'id', title: "Identifier" }
            ],
            list: [
                { label: 'My back yard', id: "x" },
                { label: 'Your back yard', id: "y" },
                { label: 'Downtown', id: "z" }
            ]
        },
        Technique: {
            fields: [
                { name: 'label', title: "Label"},
                { name: 'id', title: "Identifier" }
            ],
            list: [
                { label: 'Slide rotation on the sugar plumb', id: "1" },
                { label: 'Like a virgin', id: "2" },
                { label: 'Playing hard to get', id: "3" }
            ]
        },
        Material: {
            fields: [
                { name: 'label', title: "Label"},
                { name: 'id', title: "Identifier" }
            ],
            list: [
                { label: 'Shop vac', id: "1" },
                { label: 'Electric toothbrush', id: "2" },
                { label: 'Chainsaw', id: "3" }
            ]
        },
        DigitalRights: {
            fields: [
                { name: 'label', title: "Label"},
                { name: 'id', title: "Identifier" }
            ],
            list: [
                { label: 'Mine all mine, go away!', id: "1" },
                { label: 'You can look but you cannot touch', id: "2" },
                { label: 'Here, my photos are your photos', id: "3" }
            ]
        },
        StorageLocationType: {
            fields: [
                { name: 'label', title: "Label"},
                { name: 'id', title: "Identifier" }
            ],
            list: [
                { label: 'Under the bridge near the river', id: "a" },
                { label: 'Old shoebox', id: "b" },
                { label: 'New shoebox', id: "c" },
                { label: 'Titanium safe with time lock', id: "d" }
            ]
        },
        PhotoCondition: {
            fields: [
                { name: 'label', title: "Label"},
                { name: 'id', title: "Identifier" }
            ],
            list: [
                { label: 'Pristine', id: "A" },
                { label: 'Not bad for an old shot', id: "B" },
                { label: 'Coffee stains, maybe sepia', id: "C" },
                { label: 'Ripped and torn', id: "D" },
                { label: 'Soggy, Ripped and torn', id: "E" }
            ]
        },
        AuthenticityLevel: {
            fields: [
                { name: 'label', title: "Label"},
                { name: 'id', title: "Identifier" }
            ],
            list: [
                { label: 'I swear on the grave of my grandmother', id: "1" },
                { label: 'My sister said it was true', id: "2" },
                { label: 'Bruce says it is authentic', id: "3" },
                { label: 'Not quite sure, to be honest', id: "4" }
            ]
        },
        PhotoISO: {
            fields: [
                { name: 'label', title: "Label"},
                { name: 'id', title: "Identifier" }
            ],
            list: [
                { label: 'ISO 25', id: "a" },
                { label: 'ISO 50', id: "b" },
                { label: 'ISO 100', id: "c" },
                { label: 'ISO 200', id: "d" },
                { label: 'ISO 400', id: "e" }
            ]
        },
        PhotoExposure: {
            fields: [
                { name: 'label', title: "Label"},
                { name: 'id', title: "Identifier" }
            ],
            list: [
                { label: '1 second', id: "a" },
                { label: '1/2 second', id: "b" },
                { label: '1/1000th second', id: "c" }
            ]
        },
        PhotoAperture: {
            fields: [
                { name: 'label', title: "Label"},
                { name: 'id', title: "Identifier" }
            ],
            list: [
                { label: 'F 2.8', id: "1" },
                { label: 'F 5.6', id: "2" },
                { label: 'F 11', id: "3" }
            ]
        },
        PhotoFocalLength: {
            fields: [
                { name: 'label', title: "Label"},
                { name: 'id', title: "Identifier" }
            ],
            list: [
                { label: '500mm', id: "1" },
                { label: '150mm', id: "2" },
                { label: '100mm', id: "3" },
                { label: '28mm', id: "4" }
            ]
        },
        PhotoColorDepth: {
            fields: [
                { name: 'label', title: "Label"},
                { name: 'id', title: "Identifier" }
            ],
            list: [
                { label: '32 bit', id: "a" },
                { label: '16 bit', id: "b" },
                { label: '8 bit', id: "c" },
                { label: '4 bit with transparency', id: "d" }
            ]
        },
        Default: {
            fields: [
                { name: 'label', title: "Label"}
            ],
            list: [
                { label: 'Defaulty Towers' },
                { label: 'abcdefghijklmnopqrstuvwxyz' }
            ]}
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
    ],
    documentXML: '<PhotoObject>' +
        '    <IdentificationNumber>{ "maxLength":20, "required":true }</IdentificationNumber>' +
        '    <Title>{ "required": true }</Title>' +
        '    <Type>{ "vocabulary": "PhotoType" }</Type>' +
        '    <ShortDescription>{ "paragraph":true }</ShortDescription>' +
        '    <Authenticity>{ "vocabulary": "AuthenticityLevel" }</Authenticity>' +
        '    <Condition>{ "vocabulary": "PhotoCondition" }</Condition>' +
        '    <Purpose/>' +
        '    <Collection/>' +
        '    <DigitalFile>' +
        '        <File/>' +
        '        <Comment/>' +
        '    </DigitalFile>' +
        '    <DigitalRights>{ "vocabulary": "DigitalRights" }</DigitalRights>' +
        '    <Source>' +
        '        <IdentificationNumber>' +
        '            <URI/>' +
        '        </IdentificationNumber>' +
        '        <Type>{ "vocabulary": "SourceType" }</Type>' +
        '        <Title/>' +
        '        <Description>{ "paragraph":true }</Description>' +
        '    </Source>' +
        '    <StorageLocation>' +
        '        <Type>{ "vocabulary": "StorageLocationType" }</Type>' +
        '        <Name/>' +
        '        <Description/>' +
        '    </StorageLocation>' +
        '    <CreationEvent>' +
        '        <CreationDate>{ "validator": "date" }</CreationDate>' +
        '        <Creator>{ "vocabulary": "Actor", "multiple":true }</Creator>' +
        '        <CreationPlace>{ "vocabulary": "Place" }</CreationPlace>' +
        '        <Technique>{ "vocabulary": "Technique" }</Technique>' +
        '        <Material>{ "vocabulary": "Material" }</Material>' +
        '        <TechnicalDescription>' +
        '            <Dimension>{ "validator": "pixels" }</Dimension>' +
        '            <CharacteristicsOfPhotograph>' +
        '                <ISO>{ "vocabulary": "PhotoISO" }</ISO>' +
        '                <ExposureTime>{ "vocabulary": "PhotoExposure" }</ExposureTime>' +
        '                <LensAperture>{ "vocabulary": "PhotoAperture" }</LensAperture>' +
        '                <FocalLength>{ "vocabulary": "PhotoFocalLength" }</FocalLength>' +
        '            </CharacteristicsOfPhotograph>' +
        '            <CharacteristicsOfDigitization>' +
        '                <DPIResolution>{ "validator": "DPI" }</DPIResolution>' +
        '                <ColorDepth>{ "vocabulary": "PhotoColorDepth" }</ColorDepth>' +
        '            </CharacteristicsOfDigitization>' +
        '            <Exif/>' +
        '        </TechnicalDescription>' +
        '    </CreationEvent>' +
        '</PhotoObject>',
    i18n: {
        en: {
            IdentificationNumber: "Identification Number",
            Title: "Title",
            Type: "Type",
            ShortDescription: "Short description",
            Condition: "Condition"
        },
        nl: {
            IdentificationNumber: "Identificatienummer",
            Title: "Titel",
            Type: "Type",
            ShortDescription: "Korte beschrijving",
            Condition: "Conditie"
        }
    }
};
