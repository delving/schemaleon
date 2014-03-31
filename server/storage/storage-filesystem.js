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
var crypto = require('crypto');
var util = require('../util');

/*
 * Here we handle the file system which is to hold media files, thumbnails, as well
 * as taking care of the temporary files associated with file upload and giving us
 * a place to dump database snapshots while they are being zipped up.
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

module.exports = FileSystem;

// regular expressions for extracting strings
var FILE_NAME_FROM_PATH = new RegExp('.*/([^/]*)');
var BASE_NAME_AND_EXTENSION = new RegExp('(.*)([.][^.]*)');
var HOME = 'OSCR';

// if we're going to talk about a directory, here we make sure it exists just in time
function make(existing, subdir) {
    var dir = path.join(existing, subdir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    return dir;
}

function copyRecursive(src, dest) {
    console.log('recursive '+src);
    var exists = fs.existsSync(src);
    var stats = exists && fs.statSync(src);
    var isDirectory = exists && stats.isDirectory();
    if (exists && isDirectory) {
        fs.mkdirSync(dest);
        fs.readdirSync(src).forEach(function (childItemName) {
            copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.linkSync(src, dest);
    }
}

function FileSystem(home) {
    var homePath = home || process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

    this.home = path.join(homePath, HOME);
    if (!fs.existsSync(this.home)) {
        copyRecursive(path.join('test', HOME), this.home);
    }
    this.mediaStorage = make(this.home, 'MediaStorage');
    this.mediaUpload = make(this.home, 'UploadIncoming');
    this.databaseSnapshotDir = make(this.home, 'DatabaseSnapshot');
    this.bootstrapDir = path.join(this.home, 'BootstrapData');

    // generate an MD5 hash of the contents of a file, to be used in its name
    this.hashFile = function (source, callback) {
        var callbackCalled = false;
        var hash = crypto.createHash('md5');
        hash.setEncoding('hex');
        function done(hash, error) {
            if (!callbackCalled) {
                callback(hash, error);
                callbackCalled = true;
            }
        }

        var rd = fs.createReadStream(source);
        rd.on("error", function (error) {
            done(null, error);
        });
        rd.on("end", function () {
            hash.end();
            done(hash.read(), null);
        });
        rd.pipe(hash);
    };

    // copy a file from one place to another
    this.copyFile = function (source, target, callback) {
        function done(err) {
            if (!callbackCalled) {
                callback(err);
                callbackCalled = true;
            }
        }

        var callbackCalled = false;
        var rd = fs.createReadStream(source);
        rd.on("error", function (err) {
            done(err);
        });
        var wr = fs.createWriteStream(target);
        wr.on("error", function (err) {
            done(err);
        });
        wr.on("close", function (ex) {
            done();
        });
        rd.pipe(wr);
    };

    // create a file system that is geared to storing things for one specific group
    this.forGroup = function (groupIdentifier) {
        return new GroupFileSystem(this, groupIdentifier);
    };

    // a file system that is restricted to places allowed for a given group
    function GroupFileSystem(fileSystem, groupIdentifier) {
        var gfs = this;

        // this is where we put stuff
        this.groupMediaStorage = make(fileSystem.mediaStorage, groupIdentifier);

        // these are for blueimp file upload
        this.groupMediaUpload = make(fileSystem.mediaUpload, groupIdentifier);
        this.mediaUploadDir = make(this.groupMediaUpload, 'files');
        this.mediaThumbnailDir = make(this.mediaUploadDir, 'thumbnail');
        this.mediaTempDir = make(this.groupMediaUpload, 'temp');

        // a bucket for the media
        function mediaBucketPath(identifier) {
            var bucketDirName = identifier.slice(0, 2);
            return make(gfs.groupMediaStorage, bucketDirName);
        }

        // a bucket for the thumbnails
        function thumbnailBucketPath(identifier) {
            return make(mediaBucketPath(identifier), 'thumbnail');
        }

        // the path to a media file
        this.getMedia = function (identifier, mimeType) {
            return path.join(mediaBucketPath(identifier), identifier + util.getExtensionFromMimeType(mimeType));
        };

        // the path to a thumbnail
        this.getThumbnail = function (identifier) {
            return path.join(thumbnailBucketPath(identifier), identifier + util.thumbnailExtension);
        };

        // take a file and its thumbnail into the file system storage by hashing its file name and putting it
        // in a bucket under this group's area
        this.adoptFile = function (sourcePath, targetFileName, callback) {
            var gfs = this;
            var fileExtract = FILE_NAME_FROM_PATH.exec(sourcePath);
            if (!fileExtract) {
                callback(null, null, 'File name extract mismatch: ' + sourcePath);
            }
            else {
                var fileName = (targetFileName || fileExtract[1]).toLowerCase();
                var fileNameMatch = BASE_NAME_AND_EXTENSION.exec(fileName);
                if (!fileNameMatch) {
                    callback(null, null, 'File name split mismatch: ' + fileName);
                }
                else {
                    var base = fileNameMatch[1];
                    var extension = fileNameMatch[2];
                    if (targetFileName) {
                        var targetPath = thumbnailBucketPath(base); // todo: assuming it's a thumbnail
                        var target = path.join(targetPath, fileName);
                        fileSystem.copyFile(sourcePath, target, function (copyErr) {
                            if (copyErr) {
                                callback(null, null, 'copy error:: ' + copyErr);
                            }
                            else {
                                callback(base, extension, null);
                            }
                        });
                    }
                    else {
                        fileSystem.hashFile(sourcePath, function (hash, error) {
                            if (error) {
                                callback(null, null, "hash error:: " + error);
                            }
                            else {
                                base = hash;
                                fileName = base + extension;
                                var targetPath = mediaBucketPath(base);
                                var target = path.join(targetPath, fileName);
                                fileSystem.copyFile(sourcePath, target, function (copyErr) {
                                    if (copyErr) {
                                        callback(null, null, 'copy error:: ' + copyErr);
                                    }
                                    else {
                                        callback(base, extension, null);
                                    }
                                });
                            }
                        });
                    }
                }
            }
        };
    }
}
