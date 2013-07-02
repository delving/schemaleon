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
                        value: 'Landscapes'
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

    var xmlToDoc = function (xml) {
        var generate = function (el, doc, path) {
            for (var key in el) {
                if (key == '__cnt' || key.indexOf('_asArray') > 0) continue;
                var value = el[key];
                if (_.isString(value)) {
                    doc.elements.push({ name: key, value: value });
                }
                else {
                    if (_.isArray(value)) {
                        for (var i = 0; i < value.length; i++) {
                            path.push(key);
                            doc.elements.push({ name: key, value: value[i] });
                            path.pop();
                        }
                    }
                    else if (_.isObject(value)) {
                        var subDoc = { name: key, elements: [] };
                        path.push(key);
                        generate(value, subDoc, path);
                        path.pop();
                        doc.elements.push(subDoc);
                    }
                }
            }
        };
        var result = { elements: [] };
        generate(xml, result, []);
        return result.elements[0];
    };

    it('should parse an xml document and generate', function () {
        var xml = x2js.xml_str2json(xmlString);
        var result = xmlToDoc(xml);
        var jsonString = JSON.stringify(result);
        var expectedString = JSON.stringify(expected);
        expect(jsonString).toBe(expectedString);
    })

});

