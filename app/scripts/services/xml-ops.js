'use strict';

function xmlArray(node) {
    if (!node) {
        return [];
    }
    else if (_.isArray(node)) {
        return(node);
    }
    else {
        return [ node ];
    }
}

function xmlToTree(xml) {
    function parse(key, string, to) {
        var fresh = { name: key };
        if (_.isString(string)) {
            var vx = JSON.parse(string);
            fresh.valueExpression = vx;
            if (vx.media) {
                fresh.media = { schemaName: vx.media };
            }
            else if (vx.vocabulary) {
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
}

function objectToXml(object) {
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
}

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

function xmlToObject(xml) {
    var object = x2js.xml_str2json(xml);
    strip(object);
    return object;
}

function xmlToArray(xml) {
    var object = x2js.xml_str2json(xml);
    var output = [];
    for (var listKey in object) {
        var list = object[listKey]; // assume a list at level 0
        for (var key in list) {
            if (key.indexOf('_asArray') >= 0) { // assume there's an array at level 1
                var sub = list[key];
                strip(sub);
                output = sub;
            }
        }
    }
    return output;
}

function treeToObject(tree) {
    function clean(from, out) {
        if (from.elements) {
            var sub = {};
            _.forEach(from.elements, function (element) {
                clean(element, sub);
            });
            if (!_.isEmpty(sub)) {
                out[from.name] = sub;
            }
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
}

function cleanTree(tree, i18n) {
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
}

function collectSummaryFields(tree, summary) {
    function collect(el) {
        if (el.elements) {
            _.forEach(el.elements, function (element) {
                collect(element);
            });
        }
        else if (el.valueExpression && el.valueExpression.summaryField) {
            summary[el.valueExpression.summaryField] = el.value ? el.value : '?';
        }
    }

    collect(tree, summary);
}

function populateTree(tree, object) {

    function createClones(element, valueArray) {
        if (!element.multiple) {
            throw "Multiple values for " + element.name + ":" + valueArray;
        }
        var stamp = JSON.stringify(element);
        var lastOne = _.last(valueArray);
        return _.map(valueArray, function (value) {
            var clone = JSON.parse(stamp);
            clone.value = value;
            if (value != lastOne) {
                delete clone.multiple;
            }
            return clone;
        });
    }

    function populate(el, key, node) {
        if (key == el.name) {
            if (el.elements) {
                var sub = node[key];
                for (var subKey in sub) {
                    var elements = _.map(el.elements,
                        (function (key) {
                            return function (element) {
                                if (key == element.name) {
                                    var subValue = sub[key];
                                    if (subValue) {
                                        if (_.isArray(subValue)) {
                                            return createClones(element, subValue);
                                        }
                                        else {
                                            populate(element, key, sub);
                                        }
                                    }
                                }
                                return element;
                            }
                        })(subKey)
                    );
                    el.elements = _.flatten(elements);
                }
            }
            else {
                el.value = node[key];
            }
        }
        else {
            throw "Mismatch during tree population! key=" + key + " name=" + el.name;
        }
    }

    for (var key in object) {
        if (key != tree.name) {
            throw "Mismatch: " + key + " != " + tree.name;
        }
        populate(tree, key, object);
    }
}

function validateTree(tree) {
    function validateNode(el) {
        if (el.elements) {
            _.forEach(el.elements, function (element) {
                validateNode(element);
            });
        }
        else if (el.valueExpression && el.valueExpression.required) {
            el.invalid = el.value ? 0 : 1;
        }
    }

    validateNode(tree);
}


