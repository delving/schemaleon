var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.service("I18N",
    function ($http, $rootScope) {
        return {
            fetchList: function (lang) {
                $http.get('/i18n/' + lang)
                    .success(function (data, status, headers, config) {
                        $rootScope.i18n = data;
                    }
                ).error(function (data, status, headers, config) {
                        alert('Problem fetching i18n');
                    });
            },
            translate: function (key) {
                if ($rootScope.i18n) {
                    var value = $rootScope.i18n[key];
                    if (value) {
                        return value;
                    }
                }
                return null;
            }
        };
    }
);

CultureCollectorApp.service("Documents",
    function ($http, $log) {
        this.fetchDocument = function (identifier, success) {
            $http.get('/document/' + identifier)
                .success(function (data, status, headers, config) {
                    success(data);
                })
                .error(function (data, status, headers, config) {
                    alert('Problem fetching document');
                });
        };
    }
);

CultureCollectorApp.service("ObjectList",
    function ($http) {
        this.fetchList = function (success) {
            $http.get('/doclist')
                .success(function (data, status, headers, config) {
                    success(data);
                })
                .error(function (data, status, headers, config) {
                    alert('Problem fetching document list');
                });
        };
    }
);

CultureCollectorApp.service("Vocabulary",
    function ($http) {
        this.getStates = function (vocab, value, success) {
            $http.get('/vocabulary/list/' + vocab, {params: {q: value}})
                .success(function (data, status, headers, config) {
                    success(data);
                })
                .error(function (data, status, headers, config) {
                    alert("Problem accessing vocabulary");
                });
        };
        this.getSchema = function (vocab, success) {
            $http.get('/vocabulary/schema/' + vocab)
                .success(function (data, status, headers, config) {
                    success(data);
                })
                .error(function (data, status, headers, config) {
                    alert("Problem accessing vocabulary");
                });
        };
        this.submitValue = function (vocab, entry, success) {
            $http.post('/vocabulary/add/' + vocab, entry)
                .success(function (data, status, headers, config) {
                    success(data);
                })
                .error(function (data, status, headers, config) {
                    alert("Problem accessing vocabulary");
                });
        }
    }
);

CultureCollectorApp.service("Validator",
    function () {
        this.getFunction = function (name) {
            switch (name) {
                case 'date' :
                    break;
                case 'pixels' :
                    return function (value) {
                        if (!value.match(/^[0-9]+[Xx][0-9]+$/)) {
                            return 'Value should be WIDTHxHEIGHT, like 640x480';
                        }
                        return null;
                    };
            }
            return null;
        }
    }
);

CultureCollectorApp.service("XMLTree",
    function () {
        this.xmlToTree = function (xml) {

            function getTitle(str) {
                return str.replace(/([a-z])([A-Z])/g, "\$1 \$2");
            }

            function parse(key, string, to) {
                var title = getTitle(key);
                var fresh = { name: key, title: title };
                if (_.isString(string)) {
                    var vx = JSON.parse(string);
                    fresh.valueExpression = vx;
                    if (vx.vocabulary) {
                        fresh.vocabulary = { name: vx.vocabulary, title: getTitle(vx.vocabulary) };
                    }
                    else if (vx.paragraph) {
                        fresh.textArea = {  };
                    }
                    else {
                        fresh.textInput = { };
                        if (vx.validator) {
                            fresh.textInput.validator = vx.validator;
                        }
                    }
                    if (vx.multiple) {
                        fresh.multiple = true;
                    }
                }
                else {
                    fresh.textInput = {  };
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
                        var subDoc = { name: key, title: getTitle(key), elements: [] };
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
        };

        this.objectToXml = function (object) {
            var out = [];

            function indent(string, level) {
                return new Array(level).join('   ') + string;
            }

            function toXml(from, level) {
                for (var key in from) {
                    var value = from[key];
                    if (_.isString(value)) {
                        out.push(indent('<' + key+ '>', level) + value + '</' + key + '>');
                    }
                    else if (_.isArray(value)) {
                        _.each(value, function (item) {
                            if (_.isString(item)) {
                                out.push(indent('<' + key+ '>', level) + item + '</' + key + '>');
                            }
                            else {
                                out.push(indent('<' + key + '>', level));
                                toXml(item, level + 1);
                                out.push(indent('</' + key + '>', level));
                            }
                        });
                    }
                    else if (_.isObject(value)) {
                        out.push(indent('<' + key + '>', level));
                        toXml(value, level+1);
                        out.push(indent('</' + key + '>', level));
                    }
                }
            }

            toXml(object, 1);
            return out.join('');
        };

        this.treeToObject = function (tree) {
            function clean(from, out) {
                if (from.elements) {
                    var sub = {};
                    _.forEach(from.elements, function (element) {
                        clean(element, sub)
                    });
                    out[from.name] = sub;
                }
                else if (from.value) {
                    if (from.multiple) {
                        if (!out[from.name]) {
                            out[from.name] = [];
                        }
                        out[from.name].push(from.value);
                    }
                    else {
                        out[from.name] = from.value;
                    }
                }
            }

            var out = {};
            clean(tree, out);
            return out;
        };
    }
);