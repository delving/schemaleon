'use strict';

describe('Service: XMLTree', function () {

    var xmlString =
        '<PhotoObject>' +
            '    <IdentificationNumber></IdentificationNumber>' +
            '    <Title>{ "multiple": true }</Title>' +
            '    <Type>' +
            '        <FirstPart/>' +
            '        <SecondPart/>' +
            '    </Type>' +
            '</PhotoObject>';

    var expectedEmpty =
    {
        name: 'PhotoObject',
        title: 'Photo Object',
        elements: [
            {
                name: 'IdentificationNumber',
                title: 'Identification Number',
                textInput: {}
            },
            {
                name: 'Title',
                title: 'Title',
                valueExpression: {"multiple": true},
                textInput: {},
                multiple: true
            },
            {
                name: 'Type',
                title: 'Type',
                elements: [
                    {
                        name: 'FirstPart',
                        title: 'First Part',
                        textInput: {}
                    },
                    {
                        name: 'SecondPart',
                        title: 'Second Part',
                        textInput: {}
                    }
                ]
            }
        ]
    };

    var expectedClean =
    {
        PhotoObject: {
            IdentificationNumber: 'one',
            Title: ['two'],
            Type: {
                FirstPart: 'threeA',
                SecondPart: 'threeB'
            }
        }
    };

    var expectedXml =
        '<PhotoObject>' +
            '   <IdentificationNumber>one</IdentificationNumber>' +
            '   <Title>two</Title>' +
            '   <Type>' +
            '      <FirstPart>threeA</FirstPart>' +
            '      <SecondPart>threeB</SecondPart>' +
            '   </Type>' +
            '</PhotoObject>';

    beforeEach(module('CultureCollectorApp'));

    var xt;

    beforeEach(inject(function (XMLTree) {
        xt = XMLTree;
    }));

    it('should parse an xml document and generate', function () {
        var result = xt.xmlToTree(xmlString);
        var jsonString = JSON.stringify(result);
        var expectedString = JSON.stringify(expectedEmpty);
        expect(jsonString).toBe(expectedString);

        console.log(jsonString);

        result.elements[0].value = 'one';
        result.elements[1].value = 'two';
        result.elements[2].elements[0].value = 'threeA';
        result.elements[2].elements[1].value = 'threeB';

        var cleaned = xt.treeToObject(result);

        var cleanedString = JSON.stringify(cleaned);
        var expectedCleanedString = JSON.stringify(expectedClean);
        expect(cleanedString).toBe(expectedCleanedString);
        console.log(cleanedString);

        var xml = xt.objectToXml(cleaned);
        console.log(xml);
        expect(xml).toBe(expectedXml);
    })

});
