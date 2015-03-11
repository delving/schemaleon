'use strict';

var _ = require('underscore');
var fs = require('fs');
var Storage = require('../../server/storage');
var util = require('../../server/util');
var defer = require('node-promise').defer;
var testUtil = require('./test-util');

function log(message) {
//    console.log(message);
}

exports.createDatabase = testUtil.createDatabase;

var SCHEMA_NAME = 'Photo';
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
var titles = _.flatten(
    _.map(colors, function (color) {
            return _.map(colors, function (color2) {
                return color + ' ' + color2;
            });
        }
    )
);
var identifiers = [];

function generateEnvelope(title, identifier) {
    return {
        header: {
            Identifier: identifier,
            Title: title,
            SchemaName: SCHEMA_NAME
        },
        xml: '<Document>' +
            '<Header>' +
            '<Identifier>' + identifier + '</Identifier>' +
            '<Title>' + title + '</Title>' +
            '<SchemaName>' + SCHEMA_NAME + '</SchemaName>' +
            '</Header>' +
            '<Body>' +
            '<Photo>' +
            '<Title>' + title + '</Title>' +
            '</Photo>' +
            '</Body>' +
            '</Document>'
    };
}

exports.testFetchSchema = function (test) {
    test.expect(2);
    testUtil.storage.Document.getDocumentSchema(SCHEMA_NAME, function (xml) {
        test.ok(xml, "no xml");
        log("fetched:\n" + xml);
        test.ok(xml.indexOf('<Photo>') == 0, "Didn't retrieve");
        schemaXml = xml;
        test.done();
    });
};


exports.testSaveDocuments = function (test) {
    function savePromise(title) {
        var deferred = defer();
        log('save promise ' + title);
        testUtil.storage.Document.saveDocument(generateEnvelope(title, '#IDENTIFIER#'), function (xml) {
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
    testUtil.storage.Document.getDocument(SCHEMA_NAME, identifier, function (xml) {
        log(xml);
        var title = 'Very ' + util.getFromXml(xml, 'Title');
        testUtil.storage.Document.saveDocument(generateEnvelope(title, identifier), function (header) {
            testUtil.storage.Document.getDocument(SCHEMA_NAME, identifier, function (xml) {
                log(xml);
                test.equal(identifier, util.getFromXml(header, 'Identifier'), 'Different identifier');
                test.done();
            });
        });
    });
};

exports.testGetDocumentList = function (test) {
    test.expect(2);
    // todo: DOCZ
    testUtil.storage.Document.getAllDocuments(SCHEMA_NAME, function (xml) {
//        console.log(xml);
        test.ok(xml, "No xml");
        test.equals(xml.match(/<Body>/g).length, 30, 'Result count wrong');
        test.done();
    })
};

exports.testSelectDocuments = function (test) {
    test.expect(2);
    // testing stemming here!
    // todo: DOCZ
    testUtil.storage.Document.selectDocuments(SCHEMA_NAME, 'yellowed', function (xml) {
        log('testSelectDocuments:');
        log(xml);
        test.equals(xml.match(/<Body>/g).length, 7 + 8, 'Result count wrong');
        test.equals(xml.match(/Yellow/g).length, 16 * 2, "Yellow count wrong");
        test.done();
    })
};

exports.dropDatabase = testUtil.dropDatabase
