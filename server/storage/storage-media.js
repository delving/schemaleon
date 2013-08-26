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
    var thumbnailPath = path.join(s.directories.mediaThumbnailDir, mediaObject.fileName);
    if (!fs.existsSync(imagePath) || !fs.existsSync(thumbnailPath)) {
        console.error('Missing a media file: ' + imagePath + ' or ' + thumbnailPath);
    }
    var fileName = s.Media.createFileName(mediaObject);
    var bucketPath = s.directories.mediaBucketDir(fileName);
    var thumbnailBucketPath = s.directories.thumbnailBucketDir(fileName);
    copyFile(imagePath, path.join(bucketPath, fileName), function (err) {
        if (err) {
            throw err;
        }
        log('File has been copied ' + fileName);
        copyFile(thumbnailPath, path.join(thumbnailBucketPath, fileName), function (err) {
            if (err) {
                throw err;
            }
            log('Thumbnail has been copied ' + fileName);
            receiver(fileName);
        });
    });
};

P.getMediaPath = function (fileName) {
    var s = this.storage;
    var bucketPath = s.directories.mediaBucketDir(fileName);
    return path.join(bucketPath, fileName);
};

P.getThumbnailPath = function (fileName) {
    var s = this.storage;
    var bucketPath = s.directories.thumbnailBucketDir(fileName);
    return path.join(bucketPath, fileName);
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

P.createFileName = function (mediaObject) {
    var s = this.storage;
    var fileName = s.ID.generateImageId();
    switch (mediaObject.mimeType) {
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
            console.log("UNKOWN MIME" + mediaObject.mimeType);
            fileName += '.jpg';
            break;
    }
    return fileName;
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
        case 'gif':
            mimeType = 'image/gif';
            break;
        default:
            console.error('No mime type for extension '+path.extname(fileName));
            break;
    }
    return mimeType;
};

function copyFile(source, target, cb) {

    log('Copy file ' + source + ' ' + target);
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

