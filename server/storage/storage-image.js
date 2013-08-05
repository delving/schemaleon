'use strict';

var fs = require('fs');
var _ = require('underscore');

module.exports = Image;

function Image(storage) {
    this.storage = storage;
}

Image.prototype.saveImage = function (imageData, receiver) {

    function copyFile(source, target, cb) {
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

    function createFileName() {
        var fileName = s.generateId("OSCR-I");
        switch (imageData.mimeType) {
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
                throw "Unknown mime type: " + imageData.mimeType;
                break;
        }
        return fileName;
    }

    var s = this.storage;
    if (!fs.existsSync(imageData.filePath)) throw 'Cannot find image file ' + imageData.filePath;
    if (!fs.existsSync(s.imageRoot)) fs.mkdirSync(s.imageRoot);
    var fileName = createFileName();
    var bucketName = s.bucketName(fileName);
    var bucketPath = s.imageRoot + '/' + bucketName;
    if (!fs.existsSync(bucketPath)) fs.mkdirSync(bucketPath);
    copyFile(imageData.filePath, bucketPath + '/' + fileName, function (err) {
        if (err) throw err;
        imageData.fileName = fileName;
        var entryXml = s.objectToXml(imageData, "Image");
        s.session.add(s.imageDocument(fileName), entryXml, function (error, reply) {
            if (reply.ok) {
                receiver(fileName);
            }
            else {
                throw error + "\n" + query;
            }
        });
    });
};

Image.prototype.getImagePath = function (fileName) {
    var s = this.storage;
    var bucketName = s.bucketName(fileName);
    return s.imageRoot + '/' + bucketName + '/' + fileName;
};

Image.prototype.getImageDocument = function(fileName, receiver) {
    var s = this.storage;
    var query = "xquery " + s.imagePath(fileName);
    s.session.execute(query, function (error, reply) {
        if (reply.ok) {
            receiver(reply.result);
        }
        else {
            throw error + "\n" + query;
        }
    });
};

Image.prototype.listImages = function (done) {
    var walk = function (dir, done) {
        var results = [];
        fs.readdir(dir, function (err, list) {
            if (err) done(err); else {
                var pending = list.length;
                if (!pending) done(null, results); else {
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
    };
    walk(this.storage.imageRoot, done);
};
