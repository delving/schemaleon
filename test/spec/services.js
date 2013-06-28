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

    var expected = '{"name":"link","value":"Landscapes","elements":[{"name":"linky"},{"name":"linko"},{"name":"linka"}]}';

    var generate = function (el, doc, path) {
        for (var key in el) {
            if (key == '__cnt' || key.indexOf('_asArray') > 0) continue;
            var value = el[key];
            doc.name = key;
            if (_.isArray(value)) {
                doc.elements = [];
                for (var i=0; i<value.length; i++) {
                    var item = {name: value[i]};
                    doc.elements.push(item)
                }
            }
            else if (_.isObject(value)) {
                path.push(key);
                generate(value, doc, path);
                path.pop();
            }
            else {
                doc.value = value;
            }
        }
    };

    it('should parse an xml document and generate', function () {
        var xml = x2js.xml_str2json(xmlString);
        console.log(JSON.stringify(xml));
        var result = {};
        generate(xml, result, []);
        var jsonString = JSON.stringify(result);
        console.log(jsonString);
        expect(jsonString).toBe(expected);
    })

});

