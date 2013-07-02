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

    var embellish = function (path, to) {
        function arraysEqual(arr1, arr2) {
            if (arr1.length !== arr2.length) return false;
            for (var i = arr1.length; i--;) if (arr1[i] !== arr2[i]) return false;
            return true;
        }
        _.each(schemas, function(member) {
            if (arraysEqual(path, member.path)) {
                for (var key in member.insert) {
                    to[key] = member.insert[key];
                }
            }
        });
    };

    var xmlToDoc = function (xml) {
        function generate(from, to, path) {
            for (var key in from) {
                if (key == '__cnt' || key.indexOf('_asArray') > 0) continue;
                path.push(key);
                var value = from[key];
                if (_.isString(value)) {
                    var stringElement = { name: key, value: value };
                    to.elements.push(stringElement);
                    embellish(path, stringElement);
                }
                else {
                    if (_.isArray(value)) {
                        for (var i = 0; i < value.length; i++) {
                            var arrayElement = { name: key, value: value[i] };
                            to.elements.push(arrayElement);
                            embellish(path, arrayElement);

                        }
                    }
                    else if (_.isObject(value)) {
                        var subDoc = { name: key, elements: [] };
                        generate(value, subDoc, path);
                        to.elements.push(subDoc);
                        embellish(path, subDoc);
                    }
                }
                path.pop();
            }
        }
        var result = { elements: [] };
        generate(xml, result, []);
        return result.elements[0];
    };

    it('should parse an xml document and generate', function () {
        var xml = x2js.xml_str2json(xmlString);
        var result = xmlToDoc(xml);
        var jsonString = JSON.stringify(result);
        var expectedString = JSON.stringify(expected);
//        console.log(jsonString);
//        console.log(expectedString);
        expect(jsonString).toBe(expectedString);
    })

});

