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
};

