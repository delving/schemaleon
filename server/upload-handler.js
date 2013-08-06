'use strict';

module.exports = UploadHandler;

function UploadHandler(req, res, callback) {
    this.req = req;
    this.res = res;
    this.callback = callback;
}

var P = UploadHandler.prototype;

P.get = function () {
    var self = this;
    var files = [];
    fs.readdir(options.uploadDir, function (err, list) {
        list.forEach(function (name) {
            var stats = fs.statSync(options.uploadDir + '/' + name);
            if (stats.isFile() && name[0] !== '.') {
                var fileInfo = new FileInfo({
                    name: name,
                    size: stats.size
                });
                fileInfo.initUrls(self.req);
                files.push(fileInfo);
            }
        });
        self.callback({files: files});
    });
};

P.post = function () {
    var self = this;
    var form = new formidable.IncomingForm();
    form.uploadDir = options.tmpDir;
    var tmpFiles = [];
    var files = [];
    var map = {};
    var counter = 1;
    var redirect;
    var finish = function () {
        counter -= 1;
        if (!counter) {
            files.forEach(function (fileInfo) {
                fileInfo.initUrls(self.req);
            });
            self.callback({files: files}, redirect);
        }
    };
    form.on('fileBegin', function (name, file) {
        tmpFiles.push(file.path);
        var fileInfo = new FileInfo(file, self.req, true);
        fileInfo.safeName();
        map[path.basename(file.path)] = fileInfo;
        files.push(fileInfo);
    });
    form.on('field', function (name, value) {
        if (name === 'redirect') {
            redirect = value;
        }
    });
    form.on('file', function (name, file) {
        var fileInfo = map[path.basename(file.path)];
        fileInfo.size = file.size;
        if (!fileInfo.validate()) {
            fs.unlink(file.path);
            return;
        }
        fs.renameSync(file.path, options.uploadDir + '/' + fileInfo.name);
        if (options.imageTypes.test(fileInfo.name)) {
            Object.keys(options.imageVersions).forEach(function (version) {
                counter += 1;
                var opts = options.imageVersions[version];
                imageMagick.resize(
                    {
                        width: opts.width,
                        height: opts.height,
                        srcPath: options.uploadDir + '/' + fileInfo.name,
                        dstPath: options.uploadDir + '/' + version + '/' +
                            fileInfo.name
                    },
                    finish
                );
            });
        }
    });
    form.on('aborted', function () {
        tmpFiles.forEach(function (file) {
            fs.unlink(file);
        });
    });
    form.on('error', function (e) {
        console.log(e);
    });
    form.on('progress', function (bytesReceived, bytesExpected) {
        if (bytesReceived > options.maxPostSize) {
            self.req.connection.destroy();
        }
    });
    form.on('end', finish).parse(self.req);
};

P.destroy = function () {
    var self = this;
    if (self.req.url.slice(0, options.uploadUrl.length) === options.uploadUrl) {
        var fileName = path.basename(decodeURIComponent(self.req.url));
        if (fileName[0] !== '.') {
            fs.unlink(options.uploadDir + '/' + fileName, function (ex) {
                Object.keys(options.imageVersions).forEach(function (version) {
                    fs.unlink(options.uploadDir + '/' + version + '/' + fileName);
                });
                self.callback({success: !ex});
            });
            return;
        }
    }
    self.callback({success: false});
};