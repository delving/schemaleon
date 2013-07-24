'use strict';

angular.module('CultureCollectorApp').service("XMLTree",
    function () {

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
                    if (key == '__cnt' || key == '__text' || key.indexOf('_asArray') >= 0 || key.indexOf('toString') >= 0) {
                        continue;
                    }
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
                        out.push(indent('<' + key + '>', level) + value + '</' + key + '>');
                    }
                    else if (_.isArray(value)) {
                        _.each(value, function (item) {
                            if (_.isString(item)) {
                                out.push(indent('<' + key + '>', level) + item + '</' + key + '>');
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
                        toXml(value, level + 1);
                        out.push(indent('</' + key + '>', level));
                    }
                }
            }

            toXml(object, 1);
            return out.join('');
        };

        this.xmlToObject = function (xml) {
            function strip(from) {
                for (var key in from) {
                    if (key == '__cnt' || key == '__text' || key.indexOf('_asArray') >= 0 || key.indexOf('toString') >= 0) {
                        delete from[key];
                    }
                    else {
                        var value = from[key];
                        if (_.isObject(value)) {
                            strip(value);
                        }
                    }
                }
            }

            var object = x2js.xml_str2json(xml);
            strip(object);
            return object;
        };

        this.treeToObject = function (tree) {
            function clean(from, out) {
                if (from.elements) {
                    var sub = {};
                    _.forEach(from.elements, function (element) {
                        clean(element, sub);
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

        this.cleanTree = function (tree, i18n) {
            function clean(el) {
                if (el.elements) {
                    _.forEach(el.elements, function (element) {
                        clean(element, i18n);
                    });
                }
                else {
                    var value = i18n.element[el.name];
                    if (value) {
                        el.title = value.title;
                        el.doc = value.doc;
                    }
                    else {
                        el.title = el.name;
                        el.doc = el.name;
                    }
                }
            }

            clean(tree);
        };
    }
);