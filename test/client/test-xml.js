'use strict';

describe('Service: XMLTree', function () {

    var xmlString =
        '<PhotoObject>' +
            '<IdentificationNumber>{ "maxLength":20, "required":true }</IdentificationNumber>' +
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
            '        <CreationDate>{"validator": "date" }</CreationDate>' +
            '        <Creator>{ "vocabulary": "Actors" }</Creator>' +
            '        <CreationPlace>{ "vocabulary": "Places" }</CreationPlace>' +
            '        <Technique>{ "vocabulary": "Techniques" }</Technique>' +
            '        <Material>{ "vocabulary": "Materials" }</Material>' +
            '        <TechnicalDescription>' +
            '            <Dimension>' +
            '                <PixelsXAxis>{ "validator": "pixels" }</PixelsXAxis>' +
            '                <PixelsYAxis>{ "validator": "pixels" }</PixelsYAxis>' +
            '            </Dimension>' +
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
            '</PhotoObject>';

    var expected =
    {
        name: 'document',
        elements: [
            {
                name: 'basics',
                elements: [
                    {
                        name: 'type',
                        value: 'Landscapes',
                        localVocabulary: {
                            options: [
                                'Landscapes',
                                'Portraits',
                                'Nudes'
                            ]
                        }
                    }
                ]
            },
            {
                name: 'object',
                elements: [
                    {
                        name: 'link',
                        value: 'linky'
                    },
                    {
                        name: 'link',
                        value: 'linko'
                    },
                    {
                        name: 'link',
                        value: 'linka'
                    }
                ]
            }
        ]
    };

    beforeEach(module('CultureCollectorApp'));

    var xt;

    beforeEach(inject(function (XMLTree) {
        xt = XMLTree;
    }));

    it('should parse an xml document and generate', function () {
        var result = xt.xmlToTree(xmlString);
        var jsonString = JSON.stringify(result);
        console.log(jsonString);
//        var expectedString = JSON.stringify(expected);
//        console.log(expectedString);
//        expect(jsonString).toBe(expectedString);
    })

});
