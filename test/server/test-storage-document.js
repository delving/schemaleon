'use strict';

var fs = require('fs');
var Storage = require('../../server/storage');
var util = require('../../server/util');

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

var schemaXml = '?';

exports.testFetchSchema = function (test) {
    test.expect(2);
    storage.Document.getDocumentSchema('Photo', function (xml) {
        test.ok(xml, "no xml");
        log("fetched:\n" + xml);
        test.ok(xml.indexOf('<Photo>') == 0, "Didn't retrieve");
        schemaXml = xml;
        test.done();
    });
};

var headerIdentifier;

exports.testSaveDocument = function (test) {
    test.expect(1);
    var body = {
        header: {
            Identifier: '#IDENTIFIER#',
            Title: 'Big Bang',
            SchemaName: 'Photo'
        },
        xml: '<Document>' +
            '<Header>' +
            '<Identifier>#IDENTIFIER#</Identifier>' +
            '<Title>Big Bang</Title>' +
            '<SchemaName>Photo</SchemaName>' +
            '</Header>' +
            '<Body>' +
            '<Photo>' +
            '<Title>Big Bang</Title>' +
            '</Photo>' +
            '</Body>' +
            '</Document>'
    };
    storage.Document.saveDocument(body, function (xml) {
        headerIdentifier = util.getFromXml(xml, 'Identifier');
        test.ok(headerIdentifier.indexOf('OSCR-') >= 0, "Didn't retrieve");
        test.done();
    });
};

exports.testSaveAnother = function (test) {
    test.expect(1);
    var body = {
        header: {
            Identifier: '#IDENTIFIER#',
            Title: 'Big Bunga Bunga',
            SchemaName: 'Photo'
        },
        xml: '<Document>' +
            '<Header>' +
            '<Identifier>#IDENTIFIER#</Identifier>' +
            '<Title>Big Bung Bunga</Title>' +
            '<SchemaName>Photo</SchemaName>' +
            '</Header>' +
            '<Body>' +
            '<Photo>' +
            '<Title>Big Bung Bunga</Title>' +
            '</Photo>' +
            '</Body>' +
            '</Document>'
    };
    storage.Document.saveDocument(body, function (xml) {
        var identifier = util.getFromXml(xml, 'Identifier');
        test.ok(identifier.indexOf('OSCR-') >= 0, "Didn't retrieve");
        test.done();
    });
};

exports.testSaveDocumentAgain = function (test) {
    test.expect(1);
    var body = {
        header: {
            Identifier: headerIdentifier,
            Title: 'Big Crazy Bang',
            SchemaName: 'Photo'
        },
        xml: '<Document>' +
            '<Header>' +
            '<Identifier>' + headerIdentifier + '</Identifier>' +
            '<Title>Big Crazy Bang</Title>' +
            '<SchemaName>Photo</SchemaName>' +
            '</Header>' +
            '<Body>' +
            '<Photo>' +
            '<Title>Big Crazy Bang</Title>' +
            '</Photo>' +
            '</Body>' +
            '</Document>'
    };
    storage.Document.saveDocument(body, function (header) {
        test.equal(headerIdentifier, util.getFromXml(header, 'Identifier'), 'Different header');
        test.done();
    });
};

exports.testGetDocument = function (test) {
    test.expect(2);
    storage.Document.getDocument('Photo', headerIdentifier, function (xml) {
        log(xml);
        test.ok(xml.indexOf(headerIdentifier) >= 0, "Id not found");
        test.ok(xml.indexOf("Crazy") >= 0, "Crazy not found");
        test.done();
    })
};

exports.testGetDocumentList = function (test) {
    test.expect(2);
    storage.Document.getAllDocuments('Photo', function (xml) {
        log(xml);
        test.ok(xml, "No xml");
        test.ok(xml.indexOf(headerIdentifier) >= 0, "No identifier found to match " + headerIdentifier);
        test.done();
    })
};

exports.testSelectDocuments = function (test) {
    test.expect(2);
    storage.Document.selectDocuments('Photo', 'bang', function (xml) {
        log('testSelectDocuments:');
        log(xml);
        test.ok(xml, "No xml");
        test.ok(xml.indexOf(headerIdentifier) >= 0, "No identifier found to match " + headerIdentifier);
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
