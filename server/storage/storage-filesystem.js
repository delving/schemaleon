'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var util = require('../util');

module.exports = FileSystem;

var fileExtractRegExp = new RegExp('.*/([^/]*)');
var fileSplitRegExp = new RegExp('(.*)([.][^.]*)');

function make(existing, subdir) {
    var dir = path.join(existing, subdir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    return dir;
}

function FileSystem(home) {
    var homePath = home || process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    this.home = make(homePath, 'OSCR-Files');
    this.mediaStorage = make(this.home, 'MediaStorage');
    this.mediaUpload = make(this.home, 'UploadIncoming');
    this.databaseSnapshotDir = make(this.home, 'DatabaseSnapshot');

    this.hashFile = function(source, callback) {
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

    this.forGroup = function(groupIdentifier) {
        return new GroupFileSystem(this, groupIdentifier);
    };

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

        this.getMedia = function(identifier, mimeType) {
            return path.join(mediaBucketPath(identifier), identifier + util.getExtensionFromMimeType(mimeType));
        };

        this.getThumbnail = function(identifier) {
            return path.join(thumbnailBucketPath(identifier), identifier + util.thumbnailExtension);
        };

        // take a file into the
        this.adoptFile = function (sourcePath, targetFileName, callback) {
            var gfs = this;
            var fileExtract = fileExtractRegExp.exec(sourcePath);
            if (!fileExtract) {
                callback(null, null, 'File name extract mismatch: ' + sourcePath);
            }
            else {
                var fileName = targetFileName || fileExtract[1];
                var fileNameMatch = fileSplitRegExp.exec(fileName);
                if (!fileNameMatch) {
                    callback(null, null, 'File name split mismatch: '+fileName);
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

function log(message) {
    console.log(message);
}
