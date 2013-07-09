var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.service("Documents", function ($http, $log) {
    this.fetchDocument = function (identifier, success) {
        $http.get('/document/' + identifier)
            .success(function (data, status, headers, config) {
                success(data);
            })
            .error(function (data, status, headers, config) {
                alert('Problem fetching document');
            });
    };
});

CultureCollectorApp.service("ObjectList", function ($http) {
    this.fetchList = function (success) {
        $http.get('/doclist')
            .success(function (data, status, headers, config) {
                success(data);
            })
            .error(function (data, status, headers, config) {
                alert('Problem fetching document list');
            });
    };
});

CultureCollectorApp.service("Vocabulary", function ($http) {
    this.getStates = function (vocab, value, success) {
        $http.get('/vocabulary/' + vocab, {params: {q: value}})
            .success(function (data, status, headers, config) {
                success(data);
            })
            .error(function (data, status, headers, config) {
                alert("Problem accessing vocabulary");
            });
    };
});

CultureCollectorApp.service("XMLTree", function () {

    this.xmlToTree = function (xml) {

        function parse(key, string, to) {
            var fresh = { name: key };
            if (_.isString(string)) {
                var vx = JSON.parse(string);
                fresh.valueExpression = vx;
                if (vx.vocabulary) {
                    fresh.vocabulary = { name: vx.vocabulary };
                }
                else if (vx.paragraph) {
                    fresh.textArea = { label: key };
                }
                else {
                    fresh.textInput = { label: key };
                }
            }
            else {
                fresh.textInput = { label: key };
            }
            to.elements.push(fresh);
        }

        function generate(from, to, path) {
            var generated = false;
            for (var key in from) {
                if (key == '__cnt' || key == '__text' || key.indexOf('_asArray') >= 0 || key.indexOf('toString') >= 0) continue;
                generated = true;
                var value = from[key];
                path.push(key);
                if (_.isString(value)) {
                    parse(key, value, to);
                }
                else if (_.isArray(value)) {
                    for (var n = 0; n < value.length; n++) {
                        var valueN = value[n];
                        parse(key, valueN, to);
                    }
                }
                else if (_.isObject(value)) {
                    var subDoc = { name: key, elements: [] };
                    if (!generate(value, subDoc, path)) {
                        parse(key, null, to);
                    }
                    else {
                        to.elements.push(subDoc);
                    }
                }
                path.pop();
            }
            return generated;
        }

        var xmlObject = x2js.xml_str2json(xml);
        var result = { elements: [] };
        generate(xmlObject, result, []);
        return result.elements[0];
    }

});