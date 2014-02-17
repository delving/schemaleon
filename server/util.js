// ================================================================================
// Copyright 2014 Delving BV, Rotterdam, Netherands
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.
// ================================================================================

/*

    This utils class contains a bunch of functions which are used in various places
    on the server side.

    Author: Gerald de Jong <gerald@delving.eu>

 */

'use strict';

var _ = require('underscore');

// generate an id with a given prefix
module.exports.generateId = function (prefix) {
    var millisSince2013 = new Date().getTime() - new Date(2013, 1, 1).getTime();
    var randomNumber = Math.floor(Math.random() * 36 * 36 * 36);
    var randomString = randomNumber.toString(36);
    while (randomString.length < 3) {
        randomString = '0' + randomString;
    }
    return 'OSCR-' + prefix + '-' + millisSince2013.toString(36) + '-' + randomString;
};

// generate a user identifier
module.exports.generateUserId = function () {
    return this.generateId('US');
};

// generate a group identifier
module.exports.generateGroupId = function () {
    return this.generateId('GR');
};

// generate a document identifier
module.exports.generateDocumentId = function (schemaName) {
    return this.generateId(schemaName);
};

// generated a vocabulary identifier
module.exports.generateVocabId = function () {
    return this.generateId('VO');
};

// make sure that anything that is to be a XQuery literal is properly quoted, and quotes within are escaped
module.exports.quote = function (value) {
    if (!value) return "''";
    return "'" + value.replace(/'/g, "\'\'") + "'";
};

// make sure that something within an XML string is not going to screw up the XML tags
module.exports.inXml = function (value) {
    if (!value) return '';
    return value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// a rather naive way to extract a bit of text between XML tags from an XML string
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

// naively convert a JSON object to XML
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

// get the preferred file name extension given a namespace
module.exports.getExtensionFromMimeType = function(mimeType) {
    var extension;
    switch (mimeType) {
        case 'image/jpeg':
        case 'image/jpg': // todo: from Sjoerd's import
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

// derive the mime type of a file from its extension
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

// get the proper thumbnail file name for a given file name
module.exports.thumbNameProper = function (fileName)  {
    if (fileName.match(/(.mp4|.MP4|.mpeg|.MPEG|.mov|.MOV|.pdf)/)) {
        return fileName.replace(/(.mp4|.MP4|.mpeg|.MPEG|.mov|.MOV|.pdf)/g, ".jpg");
    }
    else {
        return fileName;
    }
};

// our standard thumbnail extension is jpeg
module.exports.thumbnailExtension = '.jpg';

// our standard thumbnail mime type
module.exports.thumbnailMimeType = 'image/jpeg';

// send an error back in a request
module.exports.sendError = function(res, status, error) {
    res.status(status).send("<Error>"+error+"</Error>");
};

// send a polite 200 error, nothing really wrong, just saying
module.exports.sendErrorMessage = function(res, error) {
    this.sendError(res, 200, error);
};

// indicate that permission is denied here
module.exports.sendPermissionDenied = function(res, error) {
    this.sendError(res, 403, error);
};

// internal problem
module.exports.sendServerError = function(res, error) {
    this.sendError(res, 500, error);
};

// wrap the action in an authorization check so that only users in certain roles can do certain things
module.exports.authenticatedGroup = function(groupIdentifier, roleArray, req, res, action) {
    if (!req.session) {
        console.error('no session for '+groupIdentifier);
        this.sendPermissionDenied(res, 'No session');
    }
    else if (groupIdentifier != req.session.GroupIdentifier && req.session.GroupIdentifier != 'OSCR') {
        this.sendPermissionDenied(res, 'Illegal Group: ' + req.session.GroupIdentifier);
    }
    else if (roleArray.length && _.indexOf(roleArray, req.session.Role) < 0) {
        this.sendPermissionDenied(res, 'Illegal Role: ' + req.session.Role);
    }
    else {
        console.log('ok '+groupIdentifier + '/' + roleArray + ' for ' + JSON.stringify(req.session));
        action();
    }
};

// only allow the action to be performed by gods
module.exports.authenticatedGod = function(req, res, action) {
    this.authenticatedGroup('OSCR', ['Administrator'], req, res, action);
};

