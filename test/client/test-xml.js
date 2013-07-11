'use strict';

describe('Service: XMLTree', function () {

    var xmlString =
        '<PhotoObject>' +
            '    <IdentificationNumber></IdentificationNumber>' +
            '    <Title></Title>' +
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
                textInput: {}
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
            Title: 'two',
            Type: {
                FirstPart: 'threeA',
                SecondPart: 'threeB'
            }
        }
    };

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

        var cleaned = xt.treeClean(result);

        var cleanedString = JSON.stringify(cleaned);
        var expectedCleanedString = JSON.stringify(expectedClean);
        expect(cleanedString).toBe(expectedCleanedString);
        console.log(cleanedString);

//        var xmlRecord = xt.treeToXml(result);
//        console.log(xmlRecord);
//        console.log(expectedString);
    })

});
