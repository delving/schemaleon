'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('underscore');

var FileSystem = require('../../server/storage/storage-filesystem');
var fileSystem = new FileSystem('/tmp');
var groupFileSystem = fileSystem.forGroup("groupie");

var testImage = path.join('test', 'server', 'theteam.jpg');

exports.testRegex = function (test) {
    test.expect(3);
    var path = '/files/groupie/further/path/something.jpg';
    var reg = new RegExp('\/files\/([^/]+)(\/.*)');
    var match = reg.exec(path);
    test.ok(match, "no match");
    test.equal(match[1], 'groupie', "bad group");
    test.equal(match[2], '/further/path/something.jpg', "bad remainder");
    test.done();
};

exports.testContentHash = function (test) {
    test.expect(1);
    fileSystem.hashFile(testImage, function(hash, error) {
        log(hash);
        test.ok(hash, "no hash!");
        test.done();
    });
};

exports.testAdoptFile = function (test) {
    test.expect(2);
    groupFileSystem.adoptFile(testImage, false, function(target, error) {
        test.ok(!error, "error:: " + error);
        log(target);
        test.equal(target, '/tmp/OSCR-Files/MediaStorage/groupie/68/685afa53c36d34768fe0a18980efea58.jpg', "bad match");
        test.done();
    });
};

exports.testAdoptThumbnail = function (test) {
    test.expect(2);
    groupFileSystem.adoptFile(testImage, true, function(target, error) {
        test.ok(!error, "error:: " + error);
        log(target);
        test.equal(target, '/tmp/OSCR-Files/MediaStorage/groupie/68/thumbnail/685afa53c36d34768fe0a18980efea58.jpg', "bad match");
        test.done();
    });
};

function log(message) {
//    console.log(message);
}
