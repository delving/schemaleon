'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var Storage = require('../../server/storage');
var util = require('../../server/util');

function log(message, thing) {
    if (thing) {
        console.log(message, thing);
    }
    else {
        console.log(message);
    }
}

var groupIdentifier = 'OSCR';
var storage = null;
var groupFileSystem = null;

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
        groupFileSystem = s.FileSystem.forGroup(groupIdentifier);
        test.done();
    });
};

function envelope(header, body) {
    var document = {
        Header: header,
        Body: body
    };
    var documentXml = util.objectToXml(document, 'Document');
    return {
        header: header,
        body: body,
        xml: documentXml
    };
}

exports.testImageIngestion = function (test) {
    test.expect(5);
    var fileName = 'the-team.JPG';
    var sourceDir = path.join('test', 'server');
    var mediaFile = path.join(sourceDir, fileName);
    var thumbnailFile = path.join(sourceDir, 'the-team-thumb.JPG');
    copyFile(mediaFile, path.join(groupFileSystem.mediaUploadDir, fileName), function () {
        copyFile(thumbnailFile, path.join(groupFileSystem.mediaThumbnailDir, fileName), function () {
            var header = {
                Identifier: '#IDENTIFIER#',
                GroupIdentifier: groupIdentifier,
                SchemaName: 'MediaMetadata',
                TimeStamp: "#TIMESTAMP#"
            };
            var body = {
                OriginalFileName: fileName,
                MimeType: 'image/jpeg',
                HasThumbnail: 'true'
            };
            var envel = envelope(header, body);
            log('about to save document envelope', envel);
            storage.Document.saveDocument(envel, function (xml) {
                test.ok(xml.length, "no xml");
                log('saved document xml', xml);
                var schemaName = util.getFromXml(xml, "SchemaName");
                var groupIdentifier = util.getFromXml(xml, "GroupIdentifier");
                var params = {
                    schemaName : schemaName,
                    groupIdentifier: groupIdentifier
                };
                log('search with params', params);
                storage.Document.searchDocuments(params, function (results) {
                    log('listImageData', schemaName);
                    log(results);
                    test.ok(results.indexOf("theteam") > 0, 'theteam not found');
                    storage.Media.listMediaFilesForTesting(groupIdentifier, function (err, results) {
                        log('list media file results', results);
                        test.equals(results.length, 2, "should just be 2 files, but it's " + results.length);
                        var identifier = path.basename(results[0], path.extname(results[0]));
                        log('get media document with identifier and group', identifier);
                        storage.Document.getMediaDocument(groupIdentifier, identifier, function (mediaDoc) {
                            log(mediaDoc);
                            test.ok(mediaDoc.xml.indexOf("theteam") > 0, 'theteam not found');
                            log('get media document with only identifier', identifier);
                            storage.Document.getMediaDocument(null, identifier, function (mediaDoc2) {
                                log(mediaDoc2);
                                test.ok(mediaDoc2.xml.indexOf("theteam") > 0, 'theteam not found');
                                test.done();
                            });
                        });
                    });
                });
            });

        });
    });
};

exports.dropIt = function (test) {
    test.expect(1);
    rmdir('/tmp/OSCR-Files');
    storage.session.execute('drop db oscrtest', function (error, reply) {
        test.ok(reply.ok, 'problem dropping database');
        storage.session.close(function () {
            test.done();
        });
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

