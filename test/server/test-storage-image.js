'use strict';

var fs = require('fs');
var _ = require('underscore');
var storage = require('../../server/storage');

exports.setUp = function (callback) {

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

    storage.useDatabase('oscrtest', function (name) {
        console.log("using: " + name);
        callback();
    });
};

exports.testImage = function (test) {
    test.expect(4);
    var imageData = {
        filePath: 'test/data/zoomcat.jpg',
        mimeType: 'image/jpeg',
        title: 'Zoom Cat',
        uploadedBy: 'tester@delving.eu'
    };
    storage.Image.saveImage(imageData, function (fileName) {
        console.log(fileName);
        test.ok(fileName, 'no file name');
        storage.Image.listImages(function (err, results) {
            console.log(results);
            test.equals(results.length, 1, "should just be one file");
            test.equals(results[0], storage.Image.getImagePath(fileName), "image path mismatch");
            storage.Image.getImageDocument(fileName, function(doc) {
                console.log(doc);
                test.ok(doc.indexOf("Zoom Cat") > 0, 'Image title not found');
                test.done();
            });
        });
    });
};

exports.tearDown = function (callback) {

    storage.session.execute('drop db oscrtest', function (error, reply) {
        console.log("dropped oscrtest");
        callback();
    });
};
