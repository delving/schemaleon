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

var Directories = require('./directories');
var directories = new Directories();

var fs = require('fs');
var path = require('path');
var _existsSync = fs.existsSync || path.existsSync;
var formidable = require('formidable');
var nodeStatic = require('node-static');
var imageMagick = require('imagemagick');

var uploadDir = directories.mediaUploadDir;
var uploadUrl = '/files/';

var options = {
    maxPostSize: 11000000000, // 11 GB
    minFileSize: 1,
    maxFileSize: 10000000000, // 10 GB
    acceptFileTypes: /.+/i,
    // Files not matched by this regular expression force a download dialog,
    // to prevent executing any scripts in the context of the service domain:
    inlineFileTypes: /\.(gif|jpe?g|png)$/i,
    imageTypes: /\.(gif|jpe?g|png)$/i,
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
    },
    /* Uncomment and edit this section to provide the service via HTTPS:
     ssl: {
     key: fs.readFileSync('/Applications/XAMPP/etc/ssl.key/server.key'),
     cert: fs.readFileSync('/Applications/XAMPP/etc/ssl.crt/server.crt')
     },
     */
    nodeStatic: {
        cache: 3600 // seconds to cache served files
    }
};

var utf8encode = function (str) {
    return unescape(encodeURIComponent(str));
};

var fileServer = new nodeStatic.Server(directories.mediaUploadDir, options.nodeStatic);

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

var nameCountRegexp = /(?:(?: \(([\d]+)\))?(\.[^.]+))?$/;

var nameCountFunc = function (s, index, ext) {
    return ' (' + ((parseInt(index, 10) || 0) + 1) + ')' + (ext || '');
};

var FileInfo = function (file) {
    this.name = file.name;
    this.size = file.size;
    this.type = file.type;
    this.deleteType = 'DELETE';
};

var UploadHandler = function (req, res, callback) {
    this.req = req;
    this.res = res;
    this.callback = callback;
};

var FIP = FileInfo.prototype;
var UHP = UploadHandler.prototype;

FIP.validate = function () {
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

FIP.safeName = function () {
    // Prevent directory traversal and creating hidden system files:
    this.name = path.basename(this.name).replace(/^\.+/, '');
    // Prevent overwriting existing files:
    while (_existsSync(uploadDir + '/' + this.name)) {
        this.name = this.name.replace(nameCountRegexp, nameCountFunc);
    }
};

FIP.initUrls = function (req) {
    if (!this.error) {
        var self = this;
        var baseUrl = (options.ssl ? 'https:' : 'http:') + '//' + req.headers.host + uploadUrl;
        this.url = this.deleteUrl = baseUrl + encodeURIComponent(this.name);
        Object.keys(options.imageVersions).forEach(function (version) {
            if (_existsSync(uploadDir + '/' + version + '/' + self.name)) {
                self[version + 'Url'] = baseUrl + version + '/' + encodeURIComponent(self.name);
            }
        });
    }
};

UHP.get = function () {
    var self = this;
    var files = [];
    fs.readdir(uploadDir, function (err, list) {
        list.forEach(function (name) {
            var stats = fs.statSync(uploadDir + '/' + name);
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

UHP.post = function () {
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

    form.uploadDir = directories.mediaTempDir;

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
            if (!fileInfo.validate()) {
                fs.unlink(file.path);
                return;
            }
            fs.renameSync(file.path, uploadDir + '/' + fileInfo.name);
            if (options.imageTypes.test(fileInfo.name)) {
                Object.keys(options.imageVersions).forEach(function (version) {
                    counter += 1;
                    var opts = options.imageVersions[version];
                    imageMagick.resize(
                        {
                            width: opts.width,
                            height: opts.height,
                            srcPath: uploadDir + '/' + fileInfo.name,
                            dstPath: uploadDir + '/' + version + '/' + fileInfo.name
                        },
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

UHP.destroy = function () {
    var self = this;
    if (self.req.url.slice(0, uploadUrl.length) === uploadUrl) {
        var fileName = path.basename(decodeURIComponent(self.req.url));
        if (fileName[0] !== '.') {
            fs.unlink(
                uploadDir + '/' + fileName,
                function (ex) {
                    Object.keys(options.imageVersions).forEach(function (version) {
                        fs.unlink(uploadDir + '/' + version + '/' + fileName);
                    });
                    self.callback({success: !ex});
                }
            );
            return;
        }
    }
    self.callback({success: false});
};

var serve = function (req, res, next) {

    var basePath = '/files';

    if (req.url.indexOf(basePath) == 0) {

        console.log("[U] upload " + req.method + " " + req.url);

        req.url = req.url.substring(basePath.length);

        req.url = req.url ? req.url : '/';

        res.setHeader('Access-Control-Allow-Origin', options.accessControl.allowOrigin);
        res.setHeader('Access-Control-Allow-Methods', options.accessControl.allowMethods);
        res.setHeader('Access-Control-Allow-Headers', options.accessControl.allowHeaders);

        var handleResult = function (result, redirect) {
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
        };

        var setNoCacheHeaders = function () {
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            res.setHeader('Content-Disposition', 'inline; filename="files.json"');
        };

        var handler = new UploadHandler(req, res, handleResult);

        var get = function () {
            if (req.url === '/') {
                setNoCacheHeaders();
                handler.get();
            }
            else {
                fileServer.serve(req, res);
            }
        };

        switch (req.method) {
            case 'OPTIONS':
                res.end();
                break;
            case 'HEAD':
                get();
                break;
            case 'GET':
                get();
                break;
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
    }
    else {
        next();
    }
};

module.exports = serve;
