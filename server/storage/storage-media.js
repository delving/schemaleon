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

P.saveMedia = function (header, body, receiver) {
    console.log('saveMedia', header, body);
    var s = this.storage;
    var groupFileSystem = s.FileSystem.forGroup(header.GroupIdentifier);
    var mediaPath = path.join(groupFileSystem.mediaUploadDir, body.OriginalFileName);
    var thumbnailPath = path.join(groupFileSystem.mediaThumbnailDir, util.thumbNameProper(body.OriginalFileName));
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
                groupFileSystem.adoptFile(thumbnailPath, util.thumbNameProper(mediaBase + mediaExtension), function(thumbnailBase, thumbnailExtension, error) {
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

