'use strict';

var fs = require('fs');
var path = require('path');

function make(existing, subdir) {
    var dir = path.join(existing, subdir);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    return dir;
}

module.exports = function(home) {
    if (!home) {
        home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    }
    this.mediaStorage = make(home, 'OSCR-Media');
    this.mediaUpload = make(home, 'OSCR-Upload');
    this.mediaUploadDir = make(this.mediaUpload, 'files');
    this.mediaThumbnailDir = make(this.mediaUploadDir, 'thumbnail')
    this.mediaTempDir = make(this.mediaUpload, 'temp');
    this.mediaBucketDir = function (fileName) { // assumes file name is = generateId() + '.???'
        var rx = /.*-.([a-z0-9]{2})\..../g;
        var results = rx.exec(fileName);
        if (!results) {
            throw "Bucket could not be extracted from file name " + fileName;
        }
        return make(this.mediaStorage, results[1]);
    };
    this.thumbnailBucketDir = function(fileName) {
        return make(this.mediaBucketDir(fileName), 'thumbnail');
    }
};

