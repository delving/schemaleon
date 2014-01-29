'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

module.exports = FileSystem;

var fileNameRegExp = new RegExp('.*/([^/]*)');
var extensionRegExp = new RegExp('.*([.][^.]*)');

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
        var hash = crypto.createHash('md5');
        hash.setEncoding('hex');
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
        this.fileSystem = fileSystem;
        this.groupIdentifier = groupIdentifier;
        this.groupMediaUpload = make(this.fileSystem.mediaUpload, groupIdentifier);
        this.groupMediaStorage = make(this.fileSystem.mediaStorage, groupIdentifier);
        this.mediaUploadDir = make(this.groupMediaUpload, 'files');
        this.mediaThumbnailDir = make(this.mediaUploadDir, 'thumbnail');
        this.mediaTempDir = make(this.groupMediaUpload, 'temp');

        this.mediaBucketPath = function(fileName) {
            var bucketDirName = fileName.slice(0, 2);
            return make(this.groupMediaStorage, bucketDirName);
        };

        this.thumbnailBucketPath = function(fileName) {
            return make(this.mediaBucketDir(fileName), 'thumbnail');
        };

        this.adoptFile = function (filePath, isThumbnail, callback) {
            var fileNameMatch = fileNameRegExp.exec(filePath);
            if (!fileNameMatch) {
                callback(null, 'File path mismatch: ' + filePath);
            }
            else {
                var fileName = fileNameMatch[1];
                var gfs = this;
                this.fileSystem.hashFile(filePath, function (hash, error) {
                    if (error) {
                        callback(null, "hash error:: " + error);
                    }
                    else {
                        var extensionMatch = extensionRegExp.exec(fileName);
                        if (!extensionMatch) {
                            callback(null, 'Cannot get extension: ' + fileName);
                        }
                        else {
                            var extension = extensionMatch[1];
                            var targetPath = isThumbnail ? gfs.thumbnailBucketPath(hash) : gfs.mediaBucketPath(hash);
                            var target = path.join(targetPath, hash + extension);
                            gfs.fileSystem.copyFile(filePath, target, function (copyErr) {
                                if (copyErr) {
                                    callback(null, 'copy error:: ' + copyErr);
                                }
                                else {
                                    callback(target, null);
                                }
                            });
                        }
                    }
                });
            }
        };
    }
}

function log(message) {
    console.log(message);
}
