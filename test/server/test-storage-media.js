'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var Storage = require('../../server/storage');

function log(message) {
//    console.log(message);
}

var storage = null;

function rmdir(dir) {
    var list = fs.readdirSync(dir);
    _.each(list, function (entry) {
        if (entry[0] != '.') {
            var fileName = path.join(dir, entry);
            var stat = fs.statSync(fileName);
            if (stat.isDirectory()) {
                rmdir(fileName);
            }
            else {
                fs.unlinkSync(fileName);
                log('removed ' + fileName);
            }
        }
    });
    fs.rmdirSync(dir);
    log('removed ' + dir);
}

exports.createDatabase = function (test) {
    test.expect(1);
    Storage('oscrtest', '/tmp', function (s) {
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
    var documentXml = storage.Util.objectToXml(document, 'Document');
    return {
        header: header,
        xml: documentXml
    };
}

exports.testImageIngestion = function (test) {
    test.expect(4);
    var fileName = 'zoomcat.jpg';
    copyFile(path.join('test/data', fileName), path.join(storage.directories.mediaUploadDir, fileName), function () {
        copyFile(path.join('test/data', fileName), path.join(storage.directories.mediaThumbnailDir, fileName), function () {

            var body = {
                Creator: 'zoomy',
                Description: 'disturbing',
                Collection: 'lolcats'
            };
            var header = {
                Identifier: '#IDENTIFIER#',
                SchemaName: 'MediaMetadata',
                TimeStamp: "#TIMESTAMP#",
                EMail: 'oscr@delving.eu',
                MediaObject: {
                    fileName: fileName,
                    mimeType: 'image/jpeg'
                }
            };
            var envel = envelope(header, body);
            log('about to save document');
            log(envel);
            storage.Document.saveDocument(envel, function (xml) {
                test.ok(xml, "no xml");
                log('xml:');
                log(xml);
                var schemaName = storage.Util.getFromXml(xml, "SchemaName");
                storage.Document.getAllDocuments(schemaName, function (results) {
                    log('listImageData for ' + schemaName);
                    log(results);
                    test.ok(results.indexOf("zoomy") > 0, 'zoomy not found');
                    storage.Media.listMediaFiles(function (err, results) {
                        log('list media file results');
                        log(results);
                        test.equals(results.length, 2, "should just be 2 files, but it's " + results.length);
                        var newFileName = path.basename(results[0]);
                        storage.Document.getDocument(schemaName, newFileName, function (doc) {
                            test.ok(doc.indexOf("zoomy") > 0, 'zoomy not found');
                            test.done();
                        });
                    });
                });
            });

        });
    });
};

exports.dropIt = function (test) {
    test.expect(1);
    rmdir(storage.directories.mediaStorage);
    rmdir(storage.directories.mediaUpload);
    storage.session.execute('drop db oscrtest', function (error, reply) {
        test.ok(reply.ok, 'problem dropping database');
        test.done();
    });
};

function copyFile(source, target, cb) {
    log('copy file ' + source + " " + target);//

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

