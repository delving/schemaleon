'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('underscore');

module.exports = Media;

function Media(storage) {
    this.storage = storage;
}

var P = Media.prototype;

function log(message) {
//    console.log(message);
}

P.saveMedia = function (mediaObject, receiver) {
    log('saveMedia');
    var s = this.storage;
    var imagePath = path.join(s.directories.mediaUploadDir, mediaObject.fileName);
    if (!fs.existsSync(imagePath)) {
        throw 'Cannot find image file ' + imagePath;
    }
    var fileName = createFileName(s, mediaObject);
    var bucketName = s.imageBucketName(fileName);
    var bucketPath = path.join(s.directories.mediaStorage, bucketName);
    if (!fs.existsSync(bucketPath)) {
        fs.mkdirSync(bucketPath);
    }
    copyFile(imagePath, path.join(bucketPath, fileName), function (err) {
        if (err) {
            throw err;
        }
        log('file has been copied ' + fileName);
        receiver(fileName);
    });
};

P.getMediaPath = function (fileName) {
    var s = this.storage;
    var bucketName = s.imageBucketName(fileName);
    return s.directories.mediaStorage + '/' + bucketName + '/' + fileName;
};

// ============= for testing only:

P.listMediaFiles = function (done) {
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

    walk(this.storage.directories.mediaStorage, done);
};

function copyFile(source, target, cb) {

    log('copy file ' + source + ' ' + target);
    var cbCalled = false;

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

    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
}

function createFileName(s, digitalObject) {
    var fileName = s.generateImageId();
    switch (digitalObject.mimeType) {
        case 'image/jpeg':
            fileName += '.jpg';
            break;
        case 'image/png':
            fileName += '.png';
            break;
        case 'image/gif':
            fileName += '.gif';
            break;
        default:
            console.log("UNKOWN MIME" + digitalObject.mimeType);
            fileName += '.jpg';
            break;
    }
    return fileName;
}
