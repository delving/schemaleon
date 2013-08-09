'use strict';

var fs = require('fs');
var Storage = require('../../server/storage');

function log(message) {
//    console.log(message);
}

var storage = null;

exports.createDatabase = function (test) {
    test.expect(1);
    Storage('oscrtest', function(s) {
        test.ok(s, 'problem creating database');
        storage = s;
        test.done();
    });
};

var schemaXml = '?';

exports.testFetchSchema = function (test) {
    test.expect(2);
    storage.Document.getDocumentSchema('Photograph', function (xml) {
        test.ok(xml, "no xml");
//        log("fetched:\n" + xml);
        test.ok(xml[0].indexOf('<Photograph>') == 0, "Didn't retrieve");
        schemaXml = xml[0];
        test.done();
    });
};

var hdr = {};

exports.testSaveDocument = function (test) {
    test.expect(1);
    var body = {
        header: {
            Identifier: '#IDENTIFIER#',
            Title: 'Big Bang',
            SchemaName: 'Photograph.xml'
        },
        xml: '<Document>' +
            '<Header>' +
            '<Identifier>#IDENTIFIER#</Identifier>' +
            '<Title>Big Bang</Title>' +
            '<SchemaName>Photograph</SchemaName>' +
            '</Header>' +
            '<Body>' +
            '<Photograph>' +
            '<Title>Test Document</Title>' +
            '<ShortDescription>An attempt</ShortDescription>' +
            '</Photograph>' +
            '</Body>' +
            '</Document>'
    };
    storage.Document.saveDocument(body, function (header) {
        hdr = header;
        test.ok(header.Identifier.indexOf('OSCR-D') >= 0, "Didn't retrieve");
        test.done();
    });
};

exports.testSaveAnother = function (test) {
    test.expect(1);
    var body = {
        header: {
            Identifier: '#IDENTIFIER#',
            Title: 'Big Bunga Bunga',
            SchemaName: 'Photograph'
        },
        xml: '<Document>' +
            '<Header>' +
            '<Identifier>#IDENTIFIER#</Identifier>' +
            '<Title>Big Bungasconi</Title>' +
            '<SchemaName>Photograph</SchemaName>' +
            '</Header>' +
            '<Body>' +
            '<Photograph>' +
            '<Title>Incriminating</Title>' +
            '<ShortDescription>Censored</ShortDescription>' +
            '</Photograph>' +
            '</Body>' +
            '</Document>'
    };
    storage.Document.saveDocument(body, function (header) {
        test.ok(header.Identifier.indexOf('OSCR-D') >= 0, "Didn't retrieve");
        test.done();
    });
};

exports.testSaveDocumentAgain = function (test) {
    test.expect(1);
    hdr.Title = 'Big Crazy Bang';
    var body = {
        header: hdr,
        xml: '<Document>' +
            '<Header>' +
            '<Identifier>' + hdr.Identifier + '</Identifier>' +
            '<Title>Big Crazy Bang</Title>' +
            '<SchemaName>Photograph</SchemaName>' +
            '</Header>' +
            '<Body>' +
            '<Photograph>' +
            '<Title>Test Document</Title>' +
            '<ShortDescription>An attempt</ShortDescription>' +
            '<ShortDescription>and more</ShortDescription>' +
            '</Photograph>' +
            '</Body>' +
            '</Document>'
    };
    storage.Document.saveDocument(body, function (header) {
        test.equal(header, hdr, 'Different header');
        test.done();
    });
};

exports.testGetDocument = function (test) {
    test.expect(2);
    storage.Document.getDocument(hdr.SchemaName, hdr.Identifier, function (xml) {
//        log(xml);
        test.ok(xml.indexOf(hdr.Identifier) >= 0, "Id not found");
        test.ok(xml.indexOf("Crazy") >= 0, "Crazy not found");
        test.done();
    })
};

exports.testGetDocumentList = function (test) {
    test.expect(2);
    storage.Document.getDocumentList('Photograph', function (xml) {
        log(xml);
        test.ok(xml, "No xml");
        test.ok(xml.indexOf(hdr.Identifier) >= 0, "No identifier found");
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
