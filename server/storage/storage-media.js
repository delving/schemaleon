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

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var util = require('../util');

/*
 * Handle the storage of media with the accompanying documents
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

module.exports = Media;

function Media(storage) {
    this.storage = storage;
}

var P = Media.prototype;

function log(message) {
    console.log('storage-media.js: ', message);
}

// save a media object, which involves adopting the file into the media file system directories.  only after that
// is finished can we execute the callback so that the actual MediaMetadata document can be stored

P.saveMedia = function (header, body, receiver) {
    console.log('saveMedia', header, body);
    var s = this.storage;
    var groupFileSystem = s.FileSystem.forGroup(header.GroupIdentifier);
    var mediaPath = path.join(groupFileSystem.mediaUploadDir, body.MediaMetadata.OriginalFileName);
    var thumbnailPath = path.join(groupFileSystem.mediaThumbnailDir, util.thumbNameProper(body.MediaMetadata.OriginalFileName));
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

// only for testing
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

