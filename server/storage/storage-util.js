'use strict';

var _ = require('underscore');

module.exports = Util;

function Util(storage) {
    this.storage = storage;
}

var P = Util.prototype;

P.getFromXml = function (xml, tag) {
    var start = xml.indexOf('<' + tag + '>');
    if (start >= 0) {
        var end = xml.indexOf('</' + tag + '>', start);
        if (end > 0) {
            start += tag.length + 2;
            return xml.substring(start, end);
        }
    }
    return '';
};

P.objectToXml = function (object, tag) {
    var s = this.storage;
    var out = [];

    function indent(string, level) {
        return new Array(level).join('  ') + string;
    }

    function objectConvert(from, level) {
        for (var key in from) {
            var value = from[key];
            if (_.isString(value)) {
                out.push(indent('<' + key + '>', level) + s.inXml(value) + '</' + key + '>');
            }
            else if (_.isNumber(value)) {
                out.push(indent('<' + key + '>', level) + value + '</' + key + '>');
            }
            else if (_.isArray(value)) {
                _.each(value, function (item) {
                    if (_.isString(item)) {
                        out.push(indent('<' + key + '>', level) + s.inXml(item) + '</' + key + '>');
                    }
                    else {
                        out.push(indent('<' + key + '>', level));
                        objectConvert(item, level + 1);
                        out.push(indent('</' + key + '>', level));
                    }
                });
            }
            else if (_.isObject(value)) {
                out.push(indent('<' + key + '>', level));
                objectConvert(value, level + 1);
                out.push(indent('</' + key + '>', level));
            }
        }
    }

    out.push("<" + tag + ">");
    objectConvert(object, 2);
    out.push("</" + tag + ">");
    return out.join('\n');
};



