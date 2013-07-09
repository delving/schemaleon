'use strict';

CultureCollectorApp.service("XMLTree", function () {

    this.xmlToTree = function (xml) {

        function parse(key, string, to) {
            var valueExpression = JSON.parse(string);
            var fresh = { name: key, valueExpression: valueExpression };
            to.elements.push(fresh);
            console.log(JSON.stringify(fresh));
        }

        function generate(from, to, path) {
            for (var key in from) {
                if (key == '__cnt' || key == '__text' || key.indexOf('_asArray') > 0) continue;
                var value = from[key];
                path.push(key);
                if (_.isString(value)) {
                    parse(key, value, to);
                }
                else {
                    if (_.isArray(value)) {
                        for (var n = 0; n < value.length; n++) {
                            var valueN = value[n];
                            parse(key, valueN, to);
                        }
                    }
                    else if (_.isObject(value)) {
                        var subDoc = { name: key, elements: [] };
                        generate(value, subDoc, path);
                        to.elements.push(subDoc);
                        // todo: augment here too
                    }
                }
                path.pop();
            }
        }

        var xmlObject = x2js.xml_str2json(xml);
        var result = { elements: [] };
        generate(xmlObject, result, []);
        return result.elements[0];
    }

});