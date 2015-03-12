'use strict';

var _ = require('underscore');
var fs = require('fs');
var Storage = require('../../server/storage');
var util = require('../../server/util');
var defer = require('node-promise').defer;
var testUtil = require('./testutil');

function log(message) {
//    console.log(message);
}

var photoSchema = 'Photo';
var schemaXml = '?';
var colors = [
    'Red',
    'Green',
    'Blue',
    'Cyan',
    'Magenta',
    'Yellow',
    'Black',
    'White'
];
var titles = _.flatten(_.map(colors, function (color) {
    return _.map(colors, function (color2) {
        return color + ' ' + color2;
    });
}));

var identifiers = [];

function generateEnvelope(title, identifier, workingGroupIdentifier) {
    return {
        header: {
            Identifier: identifier,
            Title: title,
            SchemaName: photoSchema,
            GroupIdentifier: workingGroupIdentifier
        },
        xml: '<Document>' +
            '<Header>' +
            '<Identifier>' + identifier + '</Identifier>' +
            '<Title>' + title + '</Title>' +
            '<SchemaName>' + photoSchema + '</SchemaName>' +
            '<GroupIdentifier>' + workingGroupIdentifier + '</GroupIdentifier>' +
            '</Header>' +
            '<Body>' +
            '<Photo>' +
            '<Title>' + title + '</Title>' +
            '</Photo>' +
            '</Body>' +
            '</Document>'
    };
}

exports.createDatabase = testUtil.createDatabase;

exports.testFetchSchema = function (test) {
    test.expect(3);
    test.ok(testUtil.storage, "No storage!");
    testUtil.storage.Document.getDocumentSchema(photoSchema, function (xml) {
        test.ok(xml, "no xml");
        log("fetched:\n" + xml);
        test.ok(xml.indexOf('<Photo>') == 0, "Didn't retrieve");
        schemaXml = xml;
        test.done();
    });
};

var workerIdentifier = "?";
var workingGroupIdentifier = "?";

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

exports.testSaveDocuments = function (test) {
    function savePromise(title) {
        var deferred = defer();
        log('save promise ' + title);
        testUtil.storage.Document.saveDocument(generateEnvelope(title, '#IDENTIFIER#', workingGroupIdentifier), function (xml) {
            identifiers.push(util.getFromXml(xml, 'Identifier'));
            deferred.resolve(xml);
        });
        return deferred.promise;
    }

    var promise = null;
    _.each(titles, function (title) {
        if (promise) {
            promise = promise.then(function () {
                return savePromise(title);
            });
        }
        else {
            promise = savePromise(title);
        }
    });
    test.expect(1);
    promise.then(function () {
        test.equals(identifiers.length, titles.length, 'Not enough identifiers produced');
        test.done();
    });
};

exports.testSaveDocumentModified = function (test) {
    var whichDocument = 5;
    var identifier = identifiers[whichDocument];
    test.expect(1);
    testUtil.storage.Document.getDocument(photoSchema, workingGroupIdentifier, identifier, function (xml) {
        var title = 'Very ' + util.getFromXml(xml, 'Title');
        testUtil.storage.Document.saveDocument(generateEnvelope(title, identifier, workingGroupIdentifier), function (header) {
            testUtil.storage.Document.getDocument(photoSchema, workingGroupIdentifier, identifier, function (xml) {
                log(xml);
                test.equal(identifier, util.getFromXml(header, 'Identifier'), 'Different identifier');
                test.done();
            });
        });
    });
};

exports.testGetDocumentList = function (test) {
    test.expect(2);
    testUtil.storage.Document.getAllDocuments(photoSchema, workingGroupIdentifier, function (xml) {
//        console.log('all docs\n' + xml);
        test.ok(xml, "No xml");
        test.equals(xml.match(/<Body>/g).length, titles.length, 'Result count wrong');
        test.done();
    })
};

exports.testSearchDocuments = function (test) {
    test.expect(2);
//    console.log("total docs: " + titles.length);
    var searchParams = {
        schemaName: photoSchema,
        groupIdentifier: workingGroupIdentifier,
        searchQuery: 'yellowed',
        maxResults: 10000
    };
    testUtil.storage.Document.searchDocuments(searchParams, function (xml) {
//        console.log('testSearchDocuments:');
//        console.log(xml);
        test.equals(xml.match(/<Body>/g).length, 7 + 8, 'Result count wrong');
        test.equals(xml.match(/Yellow/g).length, 16 * 2, "Yellow count wrong");
        test.done();
    })
};

exports.dropDatabase = testUtil.dropDatabase;
