'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var Storage = require('../../server/storage');
var uploadDir = require('../../server/oscr-public').uploadDir;

function log(message) {
//    console.log(message);
}

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
                            else if (stats.isFile()) {
                                fs.unlinkSync(filePath);
                            }
                            else if (stats.isDirectory()) {
                                clearDir(filePath);
//                                fs.rmdirSync(filePath);
                            }
                        });
                    });
                }
            }
        );
    }

    var imageRoot = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/OSCR-Images';
    clearDir(imageRoot);
    test.expect(1);
    Storage('oscrtest', function (s) {
        test.ok(s, 'problem creating database');
        storage = s;
        test.done();
    });
};

function envelope(header, body) {
    var document = {
        Header: header,
        Body: body
    };
    var documentXml = storage.objectToXml(document, 'Document');
    return {
        header: header,
        xml: documentXml
    };
}

exports.testImageIngestion = function (test) {
    test.expect(4);
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
        var envel = envelope(header, body);
        storage.Document.saveDocument(envel, function (xml) {
            test.ok(xml, "no xml");
            log('xml:');
            log(xml);
            var schemaName = storage.getFromXml(xml, "SchemaName");
            storage.Image.listImageData(schemaName, function (results) {
                log('listImageData for ' + schemaName);
                log(results);
                test.ok(results.indexOf("zoomy") > 0, 'zoomy not found');
                storage.Image.listImageFiles(function (err, results) {
                    test.equals(results.length, 1, "should just be one file, but it's " + results.length);
                    var newFileName = path.basename(results[0]);
                    storage.Document.getDocument(schemaName, newFileName, function (doc) {
                        test.ok(doc.indexOf("zoomy") > 0, 'zoomy not found');
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

