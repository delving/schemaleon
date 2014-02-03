'use strict';

var _ = require('underscore');

module.exports.generateId = function (prefix) {
    var millisSince2013 = new Date().getTime() - new Date(2013, 1, 1).getTime();
    var randomNumber = Math.floor(Math.random() * 36 * 36 * 36);
    var randomString = randomNumber.toString(36);
    while (randomString.length < 3) {
        randomString = '0' + randomString;
    }
    return 'OSCR-' + prefix + '-' + millisSince2013.toString(36) + '-' + randomString;
};

module.exports.generateUserId = function () {
    return this.generateId('US');
};

module.exports.generateGroupId = function () {
    return this.generateId('GR');
};

module.exports.generateDocumentId = function (schemaName) {
    return this.generateId(schemaName);
};

module.exports.generateVocabId = function () {
    return this.generateId('VO');
};

module.exports.quote = function (value) {
    if (!value) return "''";
    return "'" + value.replace(/'/g, "\'\'") + "'";
};

module.exports.inXml = function (value) {
    if (!value) return '';
    return value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

module.exports.getFromXml = function (xml, tag) {
    if (xml) {
        var start = xml.indexOf('<' + tag + '>');
        if (start >= 0) {
            var end = xml.indexOf('</' + tag + '>', start);
            if (end > 0) {
                start += tag.length + 2;
                return xml.substring(start, end);
            }
        }
    }
    return '';
};

module.exports.objectToXml = function (object, tag) {
    var s = this.storage;
    var self = this;
    var out = [];

    function indent(string, level) {
        return new Array(level).join('  ') + string;
    }

    function objectConvert(from, level) {
        for (var key in from) {
            var value = from[key];
            if (_.isString(value)) {
                out.push(indent('<' + key + '>', level) + self.inXml(value) + '</' + key + '>');
            }
            else if (_.isNumber(value)) {
                out.push(indent('<' + key + '>', level) + value + '</' + key + '>');
            }
            else if (_.isArray(value)) {
                _.each(value, function (item) {
                    if (_.isString(item)) {
                        out.push(indent('<' + key + '>', level) + self.inXml(item) + '</' + key + '>');
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

module.exports.getExtensionFromMimeType = function(mimeType) {
    var extension;
    switch (mimeType) {
        case 'image/jpeg':
            extension = '.jpg';
            break;
        case 'image/png':
            extension = '.png';
            break;
        case 'image/gif':
            extension = '.gif';
            break;
        case 'video/mp4':
            extension = '.mp4';
            break;
        case 'video/quicktime':
            extension = '.mov';
            break;
        case 'application/pdf':
            extension = '.pdf';
            break;
    }
    return extension;
};

module.exports.getMimeTypeFromFileName = function(fileName) {
    var mimeType;
    switch(path.extname(fileName)) {
        case '.jpg':
            mimeType = 'image/jpeg';
            break;
        case '.png':
            mimeType = 'image/png';
            break;
        case '.gif':
            mimeType = 'image/gif';
            break;
        case '.mp4':
            mimeType = 'video/mp4';
            break;
        case '.mov':
            mimeType = 'video/quicktime';
            break;
        case '.pdf':
            mimeType = 'application/pdf';
            break;
        default:
            console.error('No mime type for extension '+path.extname(fileName));
            break;
    }
    return mimeType;
};

module.exports.thumbNameProper = function (thumbName)  {
    var nameProper= thumbName;
    if (thumbName.match(/(.mp4|.MP4|.mpeg|.MPEG|.mov|.MOV|.pdf)/)) {
        nameProper = thumbName.replace(/(.mp4|.MP4|.mpeg|.MPEG|.mov|.MOV|.pdf)/g, ".jpg");
    }
    return nameProper;
};

module.exports.thumbnailExtension = '.jpg';

module.exports.thumbnailMimeType = 'image/jpeg';
