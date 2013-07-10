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
        ],
        Places: [
            { label: 'My back yard', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'Your back yard', id: "0002", uri: "http://vocab.com/v/0002" },
            { label: 'Downtown', id: "0003", uri: "http://vocab.com/v/0003" }
        ],
        Techniques: [
            { label: 'Slide rotation on the sugar plumb', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'Like a virgin', id: "0002", uri: "http://vocab.com/v/0002" },
            { label: 'Playing hard to get', id: "0003", uri: "http://vocab.com/v/0003" }
        ],
        Materials: [
            { label: 'Shop vac', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'Electric toothbrush', id: "0002", uri: "http://vocab.com/v/0002" },
            { label: 'Chainsaw', id: "0003", uri: "http://vocab.com/v/0003" }
        ],
        DigitalRights: [
            { label: 'Mine all mine, go away!', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'You can look but you cannot touch', id: "0002", uri: "http://vocab.com/v/0002" },
            { label: 'Here, my photos are your photos', id: "0003", uri: "http://vocab.com/v/0003" }
        ],
        StorageLocationTypes: [
            { label: 'Under the bridge near the river', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'Old shoebox', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'New shoebox', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'Titanium safe with time lock', id: "0002", uri: "http://vocab.com/v/0002" }
        ],
        PhotoConditions: [
            { label: 'Pristine', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'Not bad for an old shot', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'Coffee stains, maybe sepia', id: "0002", uri: "http://vocab.com/v/0002" },
            { label: 'Ripped and torn', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'Soggy, Ripped and torn', id: "0003", uri: "http://vocab.com/v/0003" }
        ],
        AuthenticityLevels: [
            { label: 'I swear on the grave of my grandmother', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'My sister said it was true', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'Bruce says it is authentic', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'Not quite sure, to be honest', id: "0002", uri: "http://vocab.com/v/0002" }
        ],
        PhotoISO: [
            { label: 'ISO 25', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'ISO 50', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'ISO 100', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'ISO 200', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'ISO 400', id: "0001", uri: "http://vocab.com/v/0001" }
        ],
        PhotoExposure: [
            { label: '1 second', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: '1/2 second', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: '1/1000th second', id: "0001", uri: "http://vocab.com/v/0001" }
        ],
        PhotoAperture: [
            { label: 'F 2.8', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'F 5.6', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'F 11', id: "0001", uri: "http://vocab.com/v/0001" }
        ],
        PhotoFocalLength: [
            { label: '500mm', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: '150mm', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: '100mm', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: '28mm', id: "0002", uri: "http://vocab.com/v/0002" }
        ],
        PhotoColorDepth: [
            { label: '32 bit', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: '16 bit', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: '8 bit', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: '4 bit with transparency', id: "0002", uri: "http://vocab.com/v/0002" }
        ],
        Default: [
            { label: 'Defaulty Towers', id: "0001", uri: "http://vocab.com/v/0001" },
            { label: 'abcdefghijklmnopqrstuvwxyz', id: "0002", uri: "http://vocab.com/v/0002" }
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
    ],
    documentXML:
        '<PhotoObject>' +
        '    <IdentificationNumber>{ "maxLength":20, "required":true }</IdentificationNumber>' +
        '    <Title>{ "required": true }</Title>' +
        '    <Type>{ "vocabulary": "PhotoTypes" }</Type>' +
        '    <ShortDescription>{ "paragraph":true }</ShortDescription>' +
        '    <Authenticity>{ "vocabulary": "AuthenticityLevels" }</Authenticity>' +
        '    <Condition>{ "vocabulary": "PhotoConditions" }</Condition>' +
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
        '        <Type>{ "vocabulary": "SourceTypes" }</Type>' +
        '        <Title/>' +
        '        <Description>{ "paragraph":true }</Description>' +
        '    </Source>' +
        '    <StorageLocation>' +
        '        <Type>{ "vocabulary": "StorageLocationTypes" }</Type>' +
        '        <Name/>' +
        '        <Description/>' +
        '    </StorageLocation>' +
        '    <CreationEvent>' +
        '        <CreationDate>{ "validator": "date" }</CreationDate>' +
        '        <Creator>{ "vocabulary": "Actors", "multiple":true }</Creator>' +
        '        <CreationPlace>{ "vocabulary": "Places" }</CreationPlace>' +
        '        <Technique>{ "vocabulary": "Techniques" }</Technique>' +
        '        <Material>{ "vocabulary": "Materials" }</Material>' +
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
        '</PhotoObject>'
};
