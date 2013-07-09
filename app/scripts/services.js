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
            var valueExpression = JSON.parse(string);
            var fresh = { name: key, valueExpression: valueExpression };
            to.elements.push(fresh);
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