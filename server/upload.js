#!/usr/bin/env node
/*
 * jQuery File Upload Plugin Node.js Example 2.1.0
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2012, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/*jslint nomen: true, regexp: true, unparam: true, stupid: true */
/*global require, __dirname, unescape, console */

'use strict';

function log(message, lineNr) {
    if (!lineNr === "") {
        console.log('upload.js l.'+lineNr+':', message);
    }
    else {
        console.log('upload.js:', message);
    }
}

var fs = require('fs');
var path = require('path');
var _existsSync = fs.existsSync || path.existsSync;
var formidable = require('formidable');
var nodeStatic = require('node-static');
var imageMagick = require('imagemagick');

var pathRegExp = new RegExp('\/files\/([^/]*)');

var options = {
    maxPostSize: 11000000000, // 11 GB
    minFileSize: 1,
    maxFileSize: 10000000000, // 10 GB
    acceptFileTypes: /.+/i,
    // Files not matched by this regular expression force a download dialog,
    // to prevent executing any scripts in the context of the service domain:
    inlineFileTypes: /\.(gif|jpe?g|png)$/i,
    imageTypes: /\.(gif|jpe?g|png)$/i,
    documentTypes: /\.(pdf)$/i,
    imageVersions: {
        'thumbnail': {
            width: 160,
            height: 160
        }
    },
    accessControl: {
        allowOrigin: '*',
        allowMethods: 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
        allowHeaders: 'Content-Type, Content-Range, Content-Disposition'
    }
};

var utf8encode = function (str) {
    return unescape(encodeURIComponent(str));
};

var nameCountRegexp = /(?:(?: \(([\d]+)\))?(\.[^.]+))?$/;

var nameCountFunc = function (s, index, ext) {
    return ' (' + ((parseInt(index, 10) || 0) + 1) + ')' + (ext || '');
};

var UploadHandler = function (groupFileSystem, req, res, callback) {
    this.req = req;
    this.res = res;
    this.callback = callback;

    var FileInfo = function (file) {
        this.name = file.name;
        this.size = file.size;
        this.type = file.type;
        this.deleteType = 'DELETE';

        this.validate = function () {
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

        this.safeName = function () {
            // Prevent directory traversal and creating hidden system files:
            this.name = path.basename(this.name).replace(/^\.+/, '');
            // Prevent overwriting existing files:
            while (_existsSync(groupFileSystem.mediaUploadDir + '/' + this.name)) {
                this.name = this.name.replace(nameCountRegexp, nameCountFunc);
            }
        };

        this.initUrls = function (req) {
            if (!this.error) {
                var self = this;
                var baseUrl = (options.ssl ? 'https:' : 'http:') + '//' + req.headers.host + '/files/' + req.groupIdentifier;
                this.url = this.deleteUrl = baseUrl + encodeURIComponent(this.name);
                Object.keys(options.imageVersions).forEach(function (version) {
                    if (_existsSync(groupFileSystem.mediaUploadDir + '/' + version + '/' + self.name)) {
                        self[version + 'Url'] = baseUrl + version + '/' + encodeURIComponent(self.name);
                    }
                });
            }
        };

    };

    this.get = function () {
        var self = this;
        var files = [];
        fs.readdir(groupFileSystem.mediaUploadDir, function (err, list) {
            list.forEach(function (name) {
                var stats = fs.statSync(groupFileSystem.mediaUploadDir + '/' + name);
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

    this.post = function () {
        var handler = this;
        var form = new formidable.IncomingForm();
        var tmpFiles = [], files = [];
        var map = {};
        var counter = 1;
        var redirect;

        var finish = function () {
            counter -= 1;
            if (!counter) {
                files.forEach(function (fileInfo) {
                    fileInfo.initUrls(handler.req);
                });
                handler.callback({files: files}, redirect);
            }
        };

        form.uploadDir = groupFileSystem.mediaTempDir;

        form.on('fileBegin',
            function (name, file) {
                tmpFiles.push(file.path);
                var fileInfo = new FileInfo(file, handler.req, true);
                fileInfo.safeName();
                map[path.basename(file.path)] = fileInfo;
                files.push(fileInfo);
            }
        ).on('field',
            function (name, value) {
                if (name === 'redirect') {
                    redirect = value;
                }
            }
        ).on('file',
            function (name, file) {
                var fileInfo = map[path.basename(file.path)];
                fileInfo.size = file.size;
                console.log(fileInfo);
                if (!fileInfo.validate()) {
                    fs.unlink(file.path);
                    return;
                }
                fs.renameSync(file.path, groupFileSystem.mediaUploadDir + '/' + fileInfo.name);
                if (options.imageTypes.test(fileInfo.name)) {
                    log("thumbing images")
                    Object.keys(options.imageVersions).forEach(function (version) {
                        counter += 1;
                        var opts = options.imageVersions[version];
                        imageMagick.resize(
                            {
                                width: opts.width,
                                height: opts.height,
                                srcPath: groupFileSystem.mediaUploadDir + '/' + fileInfo.name,
                                dstPath: groupFileSystem.mediaThumbnailDir + '/' + fileInfo.name
                            },
                            finish
                        );
                    });
                }
                //TODO: PDF AND AUDIO - pdf use first page for thumb, audio -use and icon
                else {
                    //TODO: allow for other video formats (MOV, VOB ...)
                    log("thumbing other")
                    Object.keys(options.imageVersions).forEach(function (version) {
                        counter += 1;
                        var opts = options.imageVersions[version];
                        var originalFileName = fileInfo.name;
                        var frameNr = '[20]';
                        if (options.documentTypes.test(fileInfo.name)) {
                            frameNr = '[0]';
                        }
                        var frameFileName = groupFileSystem.mediaUploadDir + '/' + fileInfo.name + frameNr;
                        var thumbName = groupFileSystem.mediaUploadDir + '/' + version + '/' + originalFileName.replace(/(.mp4|.MP4|.mpeg|.MPEG|.mov|.MOV|.pdf)/g, ".jpg");
                        imageMagick.convert(
                            [frameFileName, '-resize', '160x160', '-flatten', thumbName],
                            finish
                        );
                    });
                }
            }
        ).on('aborted',
            function () {
                tmpFiles.forEach(function (file) {
                    fs.unlink(file);
                });
            }
        ).on('error',
            function (e) {
                console.log(e);
            }
        ).on('progress',
            function (bytesReceived, bytesExpected) {
                if (bytesReceived > options.maxPostSize) {
                    handler.req.connection.destroy();
                }
            }
        ).on('end', finish).parse(handler.req);
    };

    this.destroy = function () {
        var self = this;
        var fileName = path.basename(decodeURIComponent(self.req.url));
        if (fileName[0] !== '.') {
            fs.unlink(
                groupFileSystem.mediaUploadDir + '/' + fileName,
                function (ex) {
                    Object.keys(options.imageVersions).forEach(function (version) {
                        fs.unlink(groupFileSystem.mediaUploadDir + '/' + version + '/' + fileName);
                    });
                    self.callback({success: !ex});
                }
            );
            return;
        }
        self.callback({success: false});
    };

};

var serve = function (storage, req, res) {
    var pathMatch = pathRegExp.exec(req.url);
    if (!pathMatch) {
        res.status(404).send(); // todo: does this work?
        return
    }
    req.groupIdentifier = pathMatch[1];

    var groupFileSystem = storage.FileSystem.forGroup(req.groupIdentifier);

    console.log("[U] upload " + req.method + " " + req.url);

    res.setHeader('Access-Control-Allow-Origin', options.accessControl.allowOrigin);
    res.setHeader('Access-Control-Allow-Methods', options.accessControl.allowMethods);
    res.setHeader('Access-Control-Allow-Headers', options.accessControl.allowHeaders);

    function setNoCacheHeaders() {
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Content-Disposition', 'inline; filename="files.json"');
    }

    var handler = new UploadHandler(groupFileSystem, req, res, function (result, redirect) {
        if (redirect) {
            res.writeHead(302, {
                'Location': redirect.replace(/%s/, encodeURIComponent(JSON.stringify(result)))
            });
            res.end();
        }
        else {
            res.writeHead(200, {
                'Content-Type': req.headers.accept.indexOf('application/json') !== -1 ?
                    'application/json' : 'text/plain'
            });
            res.end(JSON.stringify(result));
        }
    });

    var fileServer = new nodeStatic.Server(groupFileSystem.mediaUploadDir, {
//    ssl: {
//        key: fs.readFileSync('/Applications/XAMPP/etc/ssl.key/server.key'),
//        cert: fs.readFileSync('/Applications/XAMPP/etc/ssl.crt/server.crt')
//    },
        cache: 3600
    });

    fileServer.respond = function (pathname, status, _headers, files, stat, req, res, finish) {
        // Prevent browsers from MIME-sniffing the content-type:
        _headers['X-Content-Type-Options'] = 'nosniff';
        if (!options.inlineFileTypes.test(files[0])) {
            // Force a download dialog for unsafe file extensions:
            _headers['Content-Type'] = 'application/octet-stream';
            _headers['Content-Disposition'] = 'attachment; filename="' + utf8encode(path.basename(files[0])) + '"';
        }
        nodeStatic.Server.prototype.respond.call(this, pathname, status, _headers, files, stat, req, res, finish);
    };

    function doGet() {
        if (req.url === '/') {
            setNoCacheHeaders();
            handler.get();
        }
        else {
            fileServer.serve(req, res);
        }
    }

    switch (req.method) {
        case 'OPTIONS':
            res.end();
            break;
        case 'HEAD':
            doGet();
            break;
        case 'GET':
            doGet();
            break;
        case 'POST':
            setNoCacheHeaders();
            handler.post();
            break;
        case 'DELETE':
            handler.destroy();
            break;
        default:
            res.statusCode = 405;
            res.end();
    }
};

module.exports = serve;
