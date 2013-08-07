'use strict';

var fs = require('fs');
var _ = require('underscore');
var Storage = require('../../server/storage');

var storage = null;

exports.createDatabase = function (test) {
    function clearDir(dirPath) {
        fs.readdir(dirPath,
            function (err, files) {
                if (err) {
                    console.log(JSON.stringify(err));
                }
                else if (files.length) {
                    _.each(files, function (file) {
                        var filePath = dirPath + '/' + file;
                        fs.stat(filePath, function (err, stats) {
                            if (err) {
                                console.log(JSON.stringify(err));
                            }
                            else {
                                if (stats.isFile()) {
                                    fs.unlink(filePath, function (err) {
                                        if (err) {
                                            console.log(JSON.stringify(err));
                                        }
                                    });
                                }

                                if (stats.isDirectory()) {
                                    clearDir(filePath);
                                    fs.rmdir(filePath);
                                }
                            }
                        });
                    });
                }
            }
        );
    }

    var imageRoot = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/OSCR-Images';
    clearDir(imageRoot);
//    console.log("cleaned " + imageRoot);
    test.expect(1);
    Storage('oscrtest', function(s) {
        test.ok(s, 'problem creating database');
        storage = s;
        test.done();
    });
};

exports.testImage = function (test) {
    test.expect(2);
    storage.Image.listImageData(function (results) {
//        console.log('image data:'); // todo
//        console.log(results); // todo
        test.ok(results.indexOf("Zoom Cat") > 0, 'Image title not found');
        storage.Image.listImageFiles(function (err, results) {
            test.equals(results.length, 1, "should just be one file, but it's " + results.length);
//            storage.Image.getImageDocument(results[0], function(doc) {
//                console.log(doc); // todo
//                test.ok(doc.indexOf("Zoom Cat") > 0, 'Image title not found');
//                test.done();
//            });
            test.done();
        });
    });
};

exports.dropIt = function (test) {
    test.expect(1);
    storage.session.execute('drop db oscrtest', function (error, reply) {
        test.ok(reply.ok, 'problem dropping database');
        test.done();
    });
};

