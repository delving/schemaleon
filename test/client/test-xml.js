'use strict';

describe('Service: Docs', function () {

    var xmlString =
        '<document>' +
            '<basics>' +
            '<type>Landscapes</type>' +
            '</basics>' +
            '<object>' +
            '<link>linky</link>' +
            '<link>linko</link>' +
            '<link>linka</link>' +
            '</object>' +
            '</document>';

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

    var schemas = [
        {
            path: [ 'document', 'basics', 'type' ],
            insert: {
                localVocabulary: {
                    options: [
                        'Landscapes',
                        'Portraits',
                        'Nudes'
                    ]
                }
            }
        }
    ];

    beforeEach(module('CultureCollectorApp'));

    var xt;

    beforeEach(inject(function(XMLTree) {
        xt = XMLTree;
    }));

    it('should parse an xml document and generate', function () {
        var result = xt.xmlToTree(schemas, xmlString);
        var jsonString = JSON.stringify(result);
        var expectedString = JSON.stringify(expected);
//        console.log(jsonString);
//        console.log(expectedString);
        expect(jsonString).toBe(expectedString);
    })

});
