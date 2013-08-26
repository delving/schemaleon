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

if (!String.prototype.trim) {
    String.prototype.trim = function (s) {
        return s.replace(/^\s+|\s+$/g, '');
    }
}

function xmlToTree(xml) {
    function parse(key, string, to) {
        var fresh = { name: key };
        if (_.isString(string)) {
            fresh.config = JSON.parse(string);
            var c = fresh.config;
            if (!(c.media || c.vocabulary || c.paragraph)) {
                c.line = true;
            }
        }
        else {
            fresh.config = { line: true }; // todo: maybe a mid-element?
        }
        to.elements.push(fresh);
    }

    function generate(from, to, path) {
        var generated = false;
        for (var key in from) {
            if (key == '__text') {
                _.each(from[key], function (string) {
                    string = string.trim();
                    if (string) {
                        to.config = JSON.parse(string);
                    }
                });
            }
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
                var subDoc = { name: key, elements: [], config: {} };
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
            else if (_.isNumber(value)) {
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
    function toObject(from, out) {
        if (from.elements) {
            var sub = {};
            _.each(from.elements, function (element) {
                toObject(element, sub);
            });
            if (!_.isEmpty(sub)) {
                if (from.config.multiple) {
                    if (!out[from.name]) {
                        out[from.name] = [];
                    }
                    out[from.name].push(sub);
                }
                else {
                    out[from.name] = sub;
                }
            }
        }
        else if (!_.isEmpty(from.value)) {
            if (from.config.multiple) {
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
    toObject(tree, out);
    return _.isEmpty(out) ? undefined : out;
}

function i18nTree(tree, i18n) {
    function internationalize(el) {
        if (el.elements) {
            _.forEach(el.elements, function (element) {
                internationalize(element, i18n);
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

    internationalize(tree);
}

function cloneTree(tree) {
    function clearNode(el) {
        if (el.elements) {
            _.forEach(el.elements, function (element) {
                clearNode(element);
            });
        }
        delete el.value;
        delete el.valueVisible; // only used in line
        delete el.valueFields; // only used in media and vocab
    }

    var clone = JSON.parse(JSON.stringify(tree));
    clearNode(clone);
    installValidators(clone);
    return clone;
}

function collectSummaryFields(tree, summary) {
    function collect(el) {
        if (el.elements) {
            _.forEach(el.elements, function (element) {
                collect(element);
            });
        }
        else if (el.config.summaryField) {
            summary[el.config.summaryField] = el.value ? el.value : '?';
        }
    }

    collect(tree, summary);
}

function populateTree(tree, object) {

    function createClones(element, valueArray) {
        if (!element.config.multiple) {
            throw "Multiple values for " + element.name + ":" + valueArray;
        }
        var stamp = JSON.stringify(element);
        return _.map(valueArray, function (value) {
            var clone = JSON.parse(stamp);
            installValidators(clone);
            if (_.isObject(value)) {
                var node = {};
                node[element.name] = value;
                populate(clone, element.name, node);
            }
            else {
                clone.value = value;
            }
            return clone;
        });
    }

    function createPopulator(sub, key) {
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
    }

    function populate(el, key, node) {
        if (key == el.name) {
            el.value = node[key];
            if (el.elements) {
                for (var subKey in el.value) {
                    el.elements = _.flatten(_.map(el.elements, createPopulator(el.value, subKey)));
                }
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

