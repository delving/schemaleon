'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var Storage = require('../../server/storage');
var uploadDir = require('../../server/oscr-public').uploadDir;

var storage = null;

exports.createDatabase = function (test) {
    function clearDir(dirPath) {
        fs.readdir(dirPath,
            function (err, files) {
                if (err) {
                    console.log(JSON.stringify(err));
                }
                else if (files.length) {
                    _.each(files, function (file) {
                        var filePath = dirPath + '/' + file;
                        fs.stat(filePath, function (err, stats) {
                            if (err) {
                                console.log(JSON.stringify(err));
                            }
                            else {
                                if (stats.isFile()) {
                                    fs.unlink(filePath, function (err) {
                                        if (err) {
                                            console.log(JSON.stringify(err));
                                        }
                                    });
                                }

                                if (stats.isDirectory()) {
                                    clearDir(filePath);
                                    fs.rmdir(filePath);
                                }
                            }
                        });
                    });
                }
            }
        );
    }

    var imageRoot = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/OSCR-Images';
    clearDir(imageRoot);
//    console.log("cleaned " + imageRoot);
    test.expect(1);
    Storage('oscrtest', function (s) {
        test.ok(s, 'problem creating database');
        storage = s;
        test.done();
    });
};

function envelope(header, body) {
    var document = {
        Document: {
            Header: header,
            Body: body
        }
    };
    var documentXml = storage.objectToXml(document);
    return {
        header: header,
        xml: documentXml
    };
}

exports.testImage = function (test) {
    test.expect(3);
    var fileName = 'zoomcat.jpg';
    copyFile(path.join('test/data', fileName), path.join(uploadDir, fileName), function () {
        var body = {
            Creator: 'zoomy',
            Description: 'disturbing',
            Collection: 'lolcats'
        };
        var header = {
            Identifier: '#IDENTIFIER#',
            SchemaName: 'ImageMetadata',
            TimeStamp: "#TIMESTAMP#",
            EMail: 'oscr@delving.eu',
            DigitalObject: {
                fileName: fileName,
                mimeType: 'image/jpeg'
            }
        };
        storage.Document.saveDocument(envelope(header, body), function (header) {
            test.ok(header, "no header");
            console.log('saved!');
            console.log(header);
            storage.Image.listImageData(function (results) {
                console.log('image data:'); // todo
                console.log(results); // todo
                test.ok(results.indexOf("Zoom Cat") > 0, 'Image title not found');
                storage.Image.listImageFiles(function (err, results) {
                    test.equals(results.length, 1, "should just be one file, but it's " + results.length);
                    console.log("getImageDocument for "+results[0]);
                    var newFileName = path.basename(results[0]);
                    storage.Image.getImageDocument(newFileName, function (doc) {
                        console.log(doc); // todo
                        test.ok(doc.indexOf("Zoom Cat") > 0, 'Image title not found');
                        test.done();
                    });
                });
            });

        });
    });
};

exports.dropIt = function (test) {
    test.expect(1);
    storage.session.execute('drop db oscrtest', function (error, reply) {
        test.ok(reply.ok, 'problem dropping database');
        test.done();
    });
};

function copyFile(source, target, cb) {
    console.log('copyFile ' + source + " " + target);//todo
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

