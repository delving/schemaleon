'use strict';

CultureCollectorApp.service("XMLTree", function () {

    var embellish = function (schemas, path, to) {
        function arraysEqual(arr1, arr2) {
            if (arr1.length !== arr2.length) return false;
            for (var i = arr1.length; i--;) if (arr1[i] !== arr2[i]) return false;
            return true;
        }

        _.each(schemas, function (member) {
            if (arraysEqual(path, member.path)) {
                for (var key in member.insert) {
                    to[key] = member.insert[key];
                }
            }
        });
    };

    this.xmlToTree = function (schemas, xml) {
        function generate(from, to, path) {
            for (var key in from) {
                if (key == '__cnt' || key.indexOf('_asArray') > 0) continue;
                path.push(key);
                var value = from[key];
                if (_.isString(value)) {
                    var stringElement = { name: key, value: value };
                    to.elements.push(stringElement);
                    embellish(schemas, path, stringElement);
                }
                else {
                    if (_.isArray(value)) {
                        for (var i = 0; i < value.length; i++) {
                            var arrayElement = { name: key, value: value[i] };
                            to.elements.push(arrayElement);
                            embellish(schemas, path, arrayElement);
                        }
                    }
                    else if (_.isObject(value)) {
                        var subDoc = { name: key, elements: [] };
                        generate(value, subDoc, path);
                        to.elements.push(subDoc);
                        embellish(schemas, path, subDoc);
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