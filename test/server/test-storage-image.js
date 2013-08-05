'use strict';

var fs = require('fs');
var _ = require('underscore');
var storage = require('../../server/storage');

exports.setUp = function (callback) {
    storage.useDatabase('oscrtest', function (name) {
        console.log("using: " + name);
        callback();
    });
};

exports.testImage = function (test) {
    test.expect(2);
    var imageData = {
        filePath: 'test/data/zoomcat.jpg',
        mimeType: 'image/jpeg',
        name: 'Zoom Cat',
        uploadedBy: 'tester@delving.eu'
    };
    storage.saveImage(imageData, function (fileName) {
        console.log(fileName);
        test.ok(fileName, 'no file name');
        storage.listImages(function (err, results) {
            console.log(results);
            test.equals(results.length, 1, "should just be one file");
            test.done();
        });
    });
};

exports.tearDown = function (callback) {

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
                                    clearDir(filePath + '/');
                                }
                            }
                        });
                    });
                }
            }
        );
    }

    clearDir(storage.imageRoot);
    storage.session.execute('drop db oscrtest', function (error, reply) {
        console.log("dropped oscrtest");
        callback();
    });
};
