'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var util = require('../util');

module.exports = Media;

function Media(storage) {
    this.storage = storage;
}

var P = Media.prototype;

function log(message) {
    console.log('storage-media.js: ', message);
}

P.thumbNameProper = function (thumbName)  {
    var nameProper= thumbName;
    if (thumbName.match(/(.mp4|.MP4|.mpeg|.MPEG|.mov|.MOV|.pdf)/)) {
        nameProper = thumbName.replace(/(.mp4|.MP4|.mpeg|.MPEG|.mov|.MOV|.pdf)/g, ".jpg");
    }
    return nameProper;
};

P.saveMedia = function (header, body, receiver) {
    console.log('saveMedia', header, body);
    var s = this.storage;
    var groupFileSystem = s.FileSystem.forGroup(header.GroupIdentifier);
    var mediaPath = path.join(groupFileSystem.mediaUploadDir, body.OriginalFileName);
    var thumbnailPath = path.join(groupFileSystem.mediaThumbnailDir, P.thumbNameProper(body.OriginalFileName));
    if (!fs.existsSync(mediaPath)) {
        receiver(null, null, 'Missing a media file: ' + mediaPath);
    }
    else if (!fs.existsSync(thumbnailPath)) {
        receiver(null, null, 'Missing a thumbnail file: ' + thumbnailPath);
    }
    else {
        groupFileSystem.adoptFile(mediaPath, null, function(mediaBase, mediaExtension, error) {
            if (error) {
                receiver(null, null, error);
            }
            else {
                groupFileSystem.adoptFile(thumbnailPath, mediaBase + mediaExtension, function(thumbnailBase, thumbnailExtension, error) {
                    if (error) {
                        receiver(null, null, error);
                    }
                    else {
                        receiver(mediaBase, mediaExtension, null);
                        // todo: this ties media and thumbnail together still.  should be separate
                    }
                });
            }
        });
    }
};

P.getMimeType = function(fileName) {
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

P.listMediaFilesForTesting = function (groupIdentifier, done) {
    function walk(dir, done) {
        var results = [];
        fs.readdir(dir, function (err, list) {
            if (err) {
                done(err);
            }
            else {
                var pending = list.length;
                if (!pending) {
                    done(null, results);
                }
                else {
                    list.forEach(function (file) {
                        file = dir + '/' + file;
                        fs.stat(file, function (err, stat) {
                            if (stat && stat.isDirectory()) {
                                walk(file, function (err, res) {
                                    results = results.concat(res);
                                    if (!--pending) done(null, results);
                                });
                            }
                            else {
                                results.push(file);
                                if (!--pending) done(null, results);
                            }
                        });
                    });
                }
            }
        });
    }

    walk(this.storage.FileSystem.forGroup(groupIdentifier).groupMediaStorage, done);
};

