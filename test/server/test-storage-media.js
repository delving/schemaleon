'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var util = require('../../server/util');
var testUtil = require('./testutil');

function log(message, thing) {
//    if (thing) {
//        console.log(message, thing);
//    }
//    else {
//        console.log(message);
//    }
}

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

exports.createDatabase = testUtil.createDatabase;

var workerIdentifier = "?";
var workingGroupIdentifier = "?";
var imageFileName = 'the-team.JPG';

exports.testCreateUser = function(test) {
    test.expect(1);
    testUtil.storage.Person.createUser("worker", "secret", function(userXml) {
//        console.log(userXml);
        test.ok(userXml, "Can't create second user");
        workerIdentifier = util.getFromXml(userXml, 'Identifier');
        test.done();
    });
};

exports.testCreateGroup = function(test) {
    test.expect(2);
    var group = {
        Name: 'Working Group',
        Address: 'The Office'
    };
    testUtil.storage.Person.saveGroup(group, function(groupXml) {
//        console.log(groupXml);
        test.ok(groupXml, "Can't create group");
        workingGroupIdentifier = util.getFromXml(groupXml, 'Identifier');
        testUtil.storage.Person.addUserToGroup(workerIdentifier, "Member", workingGroupIdentifier, function(userXml){
            test.ok(userXml, "Can't put user in group");
            test.done();
        });
    });
};

exports.prepare = function(test) {
    test.expect(0);
    var sourceDir = path.join('test', 'server');
    var mediaFile = path.join(sourceDir, imageFileName);
    var thumbnailFile = path.join(sourceDir, 'the-team-thumb.JPG');
    var groupFS = testUtil.storage.FileSystem.forGroup(workingGroupIdentifier);
    util.copyFile(mediaFile, path.join(groupFS.mediaUploadDir, imageFileName), function () {
        util.copyFile(thumbnailFile, path.join(groupFS.mediaThumbnailDir, imageFileName), function () {
            test.done();
        });
    });
};

exports.testImageIngestion = function (test) {
    test.expect(5);
    var header = {
        Identifier: '#IDENTIFIER#',
        GroupIdentifier: workingGroupIdentifier,
        SchemaName: 'MediaMetadata',
        TimeStamp: "#TIMESTAMP#"
    };
    var body = {
        MediaMetadata: {
            OriginalFileName: imageFileName
        },
        MimeType: 'image/jpeg',
        HasThumbnail: 'true'
    };
    var envel = envelope(header, body);
    log('about to save document envelope', envel);
    testUtil.storage.Document.saveDocument(envel, function (xml) {
        test.ok(xml.length, "no xml");
        log('saved document xml', xml);
        var schemaName = util.getFromXml(xml, "SchemaName");
        var groupIdentifier = util.getFromXml(xml, "GroupIdentifier");
        var params = {
            schemaName : schemaName,
            groupIdentifier: groupIdentifier
        };
        log('search with params', params);
        testUtil.storage.Document.searchDocuments(params, function (results) {
            log('listImageData', schemaName);
            log(results);
            test.ok(results.indexOf("the-team") > 0, 'the-team not found');
            testUtil.storage.Media.listMediaFilesForTesting(groupIdentifier, function (err, results) {
                log('list media file results', results);
                test.equals(results.length, 2, "should just be 2 files, but it's " + results.length);
                var identifier = path.basename(results[0], path.extname(results[0]));
                log('get media document with identifier and group', identifier);
                testUtil.storage.Document.getMediaDocument(groupIdentifier, identifier, function (mediaDoc) {
                    log(mediaDoc);
                    test.ok(mediaDoc.xml.indexOf("the-team") > 0, 'the-team not found');
                    log('get media document with only identifier', identifier);
                    testUtil.storage.Document.getMediaDocument(null, identifier, function (mediaDoc2) {
                        log(mediaDoc2);
                        test.ok(mediaDoc2.xml.indexOf("the-team") > 0, 'the-team not found');
                        test.done();
                    });
                });
            });
        });
    });
};

// todo: maybe delay /tmp/Schemaleon-Files?
exports.dropDatabase = testUtil.dropDatabase;
