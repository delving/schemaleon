'use strict';

var _ = require('underscore');
var fs = require('fs');
var Storage = require('../../server/storage');
var util = require('../../server/util');
var defer = require('node-promise').defer;

function log(message) {
//    console.log(message);
}

var storage = null;

exports.createDatabase = function (test) {
    test.expect(1);
    Storage('oscrtest', '/tmp', function (s) {
        test.ok(s, 'problem creating database');
        storage = s;
        test.done();
    });
};

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
    storage.Document.getDocumentSchema(SCHEMA_NAME, function (xml) {
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
        storage.Document.saveDocument(generateEnvelope(title, '#IDENTIFIER#'), function (xml) {
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
    storage.Document.getDocument(SCHEMA_NAME, identifier, function (xml) {
        log(xml);
        var title = 'Very ' + util.getFromXml(xml, 'Title');
        storage.Document.saveDocument(generateEnvelope(title, identifier), function (header) {
            storage.Document.getDocument(SCHEMA_NAME, identifier, function (xml) {
                log(xml);
                test.equal(identifier, util.getFromXml(header, 'Identifier'), 'Different identifier');
                test.done();
            });
        });
    });
};

exports.testGetDocumentList = function (test) {
    test.expect(2);
    storage.Document.getAllDocuments(SCHEMA_NAME, function (xml) {
        log(xml);
        test.ok(xml, "No xml");
        test.ok(xml.indexOf(identifiers[3]) >= 0, "No identifier found to match " + identifiers[3]);
        test.done();
    })
};

exports.testSelectDocuments = function (test) {
    test.expect(2);
    // testing stemming here!
    storage.Document.selectDocuments(SCHEMA_NAME, 'yellowed', function (xml) {
        log('testSelectDocuments:');
        log(xml);
        test.equals(xml.match(/<Body>/g).length, 7 + 8, 'Result count wrong');
        test.equals(xml.match(/Yellow/g).length, 16 * 2, "Yellow count wrong");
        test.done();
    })
};

exports.dropIt = function (test) {
    test.expect(1);
    storage.session.execute('drop db oscrtest', function (error, reply) {
        test.ok(reply.ok, 'problem dropping database');
        test.done();
    });
};
