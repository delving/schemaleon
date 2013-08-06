'use strict';

module.exports = FileInfo;

function FileInfo(file) {
    this.name = file.name;
    this.size = file.size;
    this.type = file.type;
    this.deleteType = 'DELETE';
}

var P = FileInfo.prototype;

var nameCountRegexp = /(?:(?: \(([\d]+)\))?(\.[^.]+))?$/;

function nameCountFunc(s, index, ext) {
    return ' (' + ((parseInt(index, 10) || 0) + 1) + ')' + (ext || '');
}

P.validate = function () {
    if (options.minFileSize && options.minFileSize > this.size) {
        this.error = 'File is too small';
    }
    else if (options.maxFileSize && options.maxFileSize < this.size) {
        this.error = 'File is too big';
    }
    else if (!options.acceptFileTypes.test(this.name)) {
        this.error = 'Filetype not allowed';
    }
    return !this.error;
};

P.safeName = function () {
    // Prevent directory traversal and creating hidden system files:
    this.name = path.basename(this.name).replace(/^\.+/, '');
    // Prevent overwriting existing files:
    while (_existsSync(options.uploadDir + '/' + this.name)) {
        this.name = this.name.replace(nameCountRegexp, nameCountFunc);
    }
};

P.initUrls = function (req) {
    if (!this.error) {
        var self = this;
        var baseUrl = (options.ssl ? 'https:' : 'http:') +
            '//' + req.headers.host + options.uploadUrl;
        this.url = this.deleteUrl = baseUrl + encodeURIComponent(this.name);
        Object.keys(options.imageVersions).forEach(function (version) {
            if (_existsSync(options.uploadDir + '/' + version + '/' + self.name)) {
                self[version + 'Url'] = baseUrl + version + '/' + encodeURIComponent(self.name);
            }
        });
    }
};

