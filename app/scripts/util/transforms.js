/*
 Copyright 2014 Delving BV, Rotterdam, Netherlands

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

/**
 * Some transformation functions used in various places
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

function getTime(millis) {
    var ONE_SECOND = 1000, ONE_MINUTE = ONE_SECOND * 60, ONE_HOUR = ONE_MINUTE * 60, ONE_DAY = ONE_HOUR * 24;
    var days = Math.floor(millis / ONE_DAY);
    var hourMillis = Math.floor(millis - ONE_DAY * days);
    var hours = Math.floor(hourMillis / ONE_HOUR);
    var minuteMillis = Math.floor(millis - ONE_HOUR * hours);
    var minutes = Math.floor(minuteMillis / ONE_MINUTE);
    var secondMillis = Math.floor(minuteMillis - minutes * ONE_MINUTE);
    var seconds = Math.floor(secondMillis / ONE_SECOND);
    var time = {};
    if (days > 0) {
        time.days = days;
        time.hours = hours;
    }
    else if (hours > 0) {
        time.hours = hours;
        time.minutes = minutes;
    }
    else if (minutes > 0) {
        time.minutes = minutes;
        if (minutes < 10) {
            time.seconds = seconds;
        }
    }
    else {
        time.seconds = seconds;
    }
    return time;
}

function updateTimeString(timeStamp) {
    if (!timeStamp) return null;
    var now = new Date().getTime();
    var elapsed = now - timeStamp;
    return getTime(elapsed);
}

function getExtensionFromMimeType(mimeType) {
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
}

function getExtension(fileName) {
    var fileSplitRegExp = new RegExp('(.*)([.][^.]*)');
    var fileNameMatch = fileSplitRegExp.exec(fileName);
    var extension = '';
    if (!fileNameMatch) {
        console.error('file name did not have the right form to extract extension ' + fileName);
        extension = '.jpg';
    }
    else {
        extension = fileNameMatch[2];
    }
    return extension;
}

function getMimeTypeFromFileName(fileName) {
    var mimeType;
    switch (getExtension(fileName.toLowerCase())) {
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
            console.error('No mime type for extension ' + getExtension(fileName));
            break;
    }
    return mimeType;
}

function extractMimeType(source) {
    var mime = '';
    if (source) {
        if (source.value) {
            mime = source.value.MimeType;
        }
        else if (source.Body && source.Body.MediaMetadata) {
            mime = source.Body.MediaMetadata.MimeType;
        }
        else if (_.isString(source)) {
            mime = source;
        }
    }
    return mime;
}

function isImage(source) {
    var mime = extractMimeType(source);
    return (mime && mime.indexOf('image') >= 0);
}

function isVideo(source) {
    var mime = extractMimeType(source);
    return (mime && mime.indexOf('video') >= 0);
}

function isPdf(source) {
    var mime = extractMimeType(source);
    return (mime && mime.indexOf('pdf') >= 0);
}

function isSchemaShared(schemaName, schemaMap) {
    if (!schemaMap) throw Error("schema map is nowhere to be found");
    return (_.contains(schemaMap.shared, schemaName))
}

function editPathFromHeader(header, schemaMap) {
    if (isSchemaShared(header.SchemaName, schemaMap)) {
        return '/shared/' + header.SchemaName + '/' + header.Identifier + '/edit';
    }
    else {
        return '/primary/' + header.SchemaName + '/' + header.GroupIdentifier + '/' + header.Identifier + '/edit';
    }
}

function viewPathFromHeader(header, schemaMap) {
    if (isSchemaShared(header.SchemaName, schemaMap)) {
        return '/shared/' + header.SchemaName + '/' + header.Identifier + '/view';
    }
    else {
        return '/primary/' + header.SchemaName + '/' + header.GroupIdentifier + '/' + header.Identifier + '/view';
    }
}

function defaultDocumentState(schemaName, schemaMap) {
    if (schemaMap && isSchemaShared(schemaName, schemaMap)) {
        return 'public';
    }
    else {
        return 'private'
    }
}