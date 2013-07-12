'use strict';

module.exports = {
    vocabulary: {
        PhotoType: {
            schema: "<Entry><Label/><ID/><URI/></Entry>",
            list: [
                { Label: 'Landscapes', ID: "a", URI: "http://vocab.com/v/0001" },
                { Label: 'Portraits', ID: "b", URI: "http://vocab.com/v/0002" },
                { Label: 'Nudes', ID: "c", URI: "http://vocab.com/v/0003" }
            ]
        },
        SourceType: {
            schema: "<Entry><Label/><ID/></Entry>",
            list: [
                { Label: 'Local', ID: "1" },
                { Label: 'Foreign', ID: "2" },
                { Label: 'Unknown', ID: "3" }
            ]
        },
        Actor: {
            schema: "<Entry><Label/><ID/></Entry>",
            list: [
                { Label: 'Bob Marley', ID: "1" },
                { Label: 'Jimi Hendrix', ID: "2" },
                { Label: 'Dan Brown', ID: "3" }
            ]
        },
        Place: {
            schema: "<Entry><Label/><ID/></Entry>",
            list: [
                { Label: 'My back yard', ID: "x" },
                { Label: 'Your back yard', ID: "y" },
                { Label: 'Downtown', ID: "z" }
            ]
        },
        Technique: {
            schema: "<Entry><Label/><ID/></Entry>",
            list: [
                { Label: 'Slide rotation on the sugar plumb', ID: "1" },
                { Label: 'Like a virgin', ID: "2" },
                { Label: 'Playing hard to get', ID: "3" }
            ]
        },
        Material: {
            schema: "<Entry><Label/><ID/></Entry>",
            list: [
                { Label: 'Shop vac', ID: "1" },
                { Label: 'Electric toothbrush', ID: "2" },
                { Label: 'Chainsaw', ID: "3" }
            ]
        },
        DigitalRights: {
            schema: "<Entry><Label/><ID/></Entry>",
            list: [
                { Label: 'Mine all mine, go away!', ID: "1" },
                { Label: 'You can look but you cannot touch', ID: "2" },
                { Label: 'Here, my photos are your photos', ID: "3" }
            ]
        },
        StorageLocationType: {
            schema: "<Entry><Label/><ID/></Entry>",
            list: [
                { Label: 'Under the bridge near the river', ID: "a" },
                { Label: 'Old shoebox', ID: "b" },
                { Label: 'New shoebox', ID: "c" },
                { Label: 'Titanium safe with time lock', ID: "d" }
            ]
        },
        PhotoCondition: {
            schema: "<Entry><Label/><ID/></Entry>",
            list: [
                { Label: 'Pristine', ID: "A" },
                { Label: 'Not bad for an old shot', ID: "B" },
                { Label: 'Coffee stains, maybe sepia', ID: "C" },
                { Label: 'Ripped and torn', ID: "D" },
                { Label: 'Soggy, Ripped and torn', ID: "E" }
            ]
        },
        AuthenticityLevel: {
            schema: "<Entry><Label/><ID/></Entry>",
            list: [
                { Label: 'I swear on the grave of my grandmother', ID: "1" },
                { Label: 'My sister said it was true', ID: "2" },
                { Label: 'Bruce says it is authentic', ID: "3" },
                { Label: 'Not quite sure, to be honest', ID: "4" }
            ]
        },
        PhotoISO: {
            schema: "<Entry><Label/><ID/></Entry>",
            list: [
                { Label: 'ISO 25', ID: "a" },
                { Label: 'ISO 50', ID: "b" },
                { Label: 'ISO 100', ID: "c" },
                { Label: 'ISO 200', ID: "d" },
                { Label: 'ISO 400', ID: "e" }
            ]
        },
        PhotoExposure: {
            schema: "<Entry><Label/><ID/></Entry>",
            list: [
                { Label: '1 second', ID: "a" },
                { Label: '1/2 second', ID: "b" },
                { Label: '1/1000th second', ID: "c" }
            ]
        },
        PhotoAperture: {
            schema: "<Entry><Label/><ID/></Entry>",
            list: [
                { Label: 'F 2.8', ID: "1" },
                { Label: 'F 5.6', ID: "2" },
                { Label: 'F 11', ID: "3" }
            ]
        },
        PhotoFocalLength: {
            schema: "<Entry><Label/><ID/></Entry>",
            list: [
                { Label: '500mm', ID: "1" },
                { Label: '150mm', ID: "2" },
                { Label: '100mm', ID: "3" },
                { Label: '28mm', ID: "4" }
            ]
        },
        PhotoColorDepth: {
            schema: "<Entry><Label/><ID/></Entry>",
            list: [
                { Label: '32 bit', ID: "a" },
                { Label: '16 bit', ID: "b" },
                { Label: '8 bit', ID: "c" },
                { Label: '4 bit with transparency', ID: "d" }
            ]
        },
        Default: {
            schema: "<Entry><Label/></Entry>",
            list: [
                { Label: 'Defaulty Towers' },
                { Label: 'abcdefghijklmnopqrstuvwxyz' }
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
