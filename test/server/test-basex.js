'use strict';

var basex = require('basex');
basex.debug_mode = false;

var session = new basex.Session();

exports.testCreate = function (test) {
    test.expect(1);
    session.execute('create db gumby', function (error, reply) {
        test.ok(reply.ok, 'problem creating database')
        test.done();
    });
};

exports.testAdd = function (test) {
    test.expect(1);
    session.add("/people.xml", "<people><person>Gumby\nman</person><something>else</something><person>Pokey\nhorse</person></people>", function (error, reply) {
        test.ok(reply.ok, 'problem adding');
        test.done();
    });
};

exports.testGoodQuery = function (test) {
    test.expect(1);
    var query = session.query('//person');
    query.results(function (error, reply) {
//        console.log(JSON.stringify(reply));
        test.ok(true, "made it");
        query.close();
        test.done();
    });
};

exports.testBadQuery = function (test) {
    test.expect(1);
    var query = session.query('//somethingNotThere');
    query.results(function (error, reply) {
//        console.log(JSON.stringify(reply));
        test.ok(true, "made it");
        query.close();
        test.done();
    });
};

exports.testDrop = function (test) {
    test.expect(1);
    session.execute('drop db gumby', function (error, reply) {
        test.ok(reply.ok, 'problem dropping database')
        test.done();
    });
};

