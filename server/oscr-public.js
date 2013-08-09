'use strict';

var fs = require('fs');

function make(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    return dir;
}

var homeDir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
var publicDir =  make(homeDir + '/OSCR-Public');
var uploadDir =  make(publicDir + '/files');
make(uploadDir + '/thumbnail');
var tmpDir =  make(publicDir + '/tmp');

module.exports.homeDir = homeDir;
module.exports.publicDir = publicDir;
module.exports.uploadDir = uploadDir;
module.exports.tmpDir = tmpDir;
