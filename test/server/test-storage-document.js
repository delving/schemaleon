'use strict';

var fs = require('fs');
var storage = require('../../server/storage');

exports.createDatabase = function (test) {
    console.log("create database");
    test.expect(1);
    storage.session.execute('create db oscrtest', function (error, reply) {
        test.ok(reply.ok, 'problem creating database');
        console.log("created oscrtest");
        test.done();
    });
};

exports.fillSchemas = function (test) {
    var contents = fs.readFileSync('test/data/DocumentSchemas.xml', 'utf8');
    storage.session.add('/DocumentSchemas', contents, function (error, reply) {
        if (reply.ok) {
            console.log("Preloaded document schemas");
            test.done();
        }
        else {
            throw error;
        }
    });
};

var schemaXml = '?';

exports.testFetchSchema = function (test) {
    test.expect(2);
    storage.getDocumentSchema('Photograph', function (xml) {
        test.ok(xml, "no xml");
//        console.log("fetched:\n" + xml);
        test.ok(xml[0].indexOf('<Photograph>') == 0, "Didn't retrieve");
        schemaXml = xml[0];
        test.done();
    });
};

var id = '?';

exports.testSaveDocument = function (test) {
    test.expect(1);
    var body = {
        header: {
            Identifier: '#IDENTIFIER#',
            Title: 'Big Bang',
            SchemaName: 'Photograph'
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
    storage.saveDocument(body, function (identifier) {
        id = identifier;
        test.ok(identifier.indexOf('OSCR-D') >= 0, "Didn't retrieve");
        test.done();
    });
};

exports.testSaveDocumentAgain = function(test) {
    test.expect(1);
    var body = {
        header: {
            Identifier: id,
            Title: 'Big Crazy Bang',
            SchemaName: 'Photograph'
        },
        xml: '<Document>' +
            '<Header>' +
            '<Identifier>'+id+'</Identifier>' +
            '<Title>Big Crazy Bang</Title>' +
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
    storage.saveDocument(body, function (identifier) {
        test.equal(identifier, id, 'Different identifier');
        test.done();
    });
};

exports.testGetDocument = function(test) {
    test.expect(2);
    storage.getDocument(id, function(xml) {
        console.log(xml);
        test.ok(xml.indexOf(id) >= 0, "Id not found");
        test.ok(xml.indexOf("Crazy") >= 0, "Crazy not found");
        test.done();
    })
};

exports.dropIt = function (test) {
    test.expect(1);
    storage.session.execute('drop db oscrtest', function (error, reply) {
        test.ok(reply.ok, 'problem dropping database');
        console.log("dropped oscrtest");
        test.done();
    });
};
