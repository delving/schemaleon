/*
 Copyright 2014 Delving BV, Rotterdam, Netherlands

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * This is an example from the jQuery plugin which was mangled to make it work within express,
 * and also outfitted with other stuff to handle access rights and use the proper storage locations.
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

/* ORIGINAL:
 *
 * jQuery File Upload Plugin Node.js Example 2.1.0
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2012, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 *
 * ============
 *
 * This file has been dramatically adjusted to make it work within "express" in the first place
 * and then also to make it work within OSCR.
 *
 * Author of modifications: Gerald de Jong <gerald@delving.eu>
 *
 */

'use strict';

var fs = require('fs');
var path = require('path');
var _existsSync = fs.existsSync || path.existsSync;
var formidable = require('formidable');
var nodeStatic = require('node-static');
var imageMagick = require('imagemagick');
var util = require('./util');

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
                var baseUrl = (options.ssl ? 'https:' : 'http:') + '//' + req.headers.host + '/files/' + req.groupIdentifier + '/';
                this.url = this.deleteUrl = baseUrl + encodeURIComponent(this.name);
                Object.keys(options.imageVersions).forEach(function (version) {
                    var name = util.thumbNameProper(self.name);
                    if (_existsSync(groupFileSystem.mediaUploadDir + '/' + version + '/' + name)) {
                        self[version + 'Url'] = baseUrl + version + '/' + encodeURIComponent(name);
                    }
                });
            }
        };

    };

    this.destroy = function () {
        var handler = this;
        var fileName = path.basename(decodeURIComponent(handler.req.url));
        if (fileName[0] !== '.') {
            fs.unlink(groupFileSystem.mediaUploadDir + '/' + fileName, function (error) {
                if (error) {
                    util.sendServerError(res, "unable to unlink " + groupFileSystem.mediaUploadDir + '/' + fileName);
                    console.error(error);
                }
                else {
                    Object.keys(options.imageVersions).forEach(function (version) {
                        fs.unlink(groupFileSystem.mediaUploadDir + '/' + version + '/' + util.thumbNameProper(fileName), function(error) {
                            if (error) {
                                util.sendServerError(res, "unable to unlink " + groupFileSystem.mediaUploadDir + '/' + version + '/' + util.thumbNameProper(fileName));
                                console.error(error);
                            }
                            else {
                                handler.callback({success: true});
                            }
                        });
                    });
                }
            });
            return;
        }
        handler.callback({success: false});
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
                if (!fileInfo.validate()) {
                    fs.unlink(file.path);
                    return;
                }
                fs.renameSync(file.path, groupFileSystem.mediaUploadDir + '/' + fileInfo.name);
                if (options.imageTypes.test(fileInfo.name)) {
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
                    Object.keys(options.imageVersions).forEach(function (version) {
                        counter += 1;
                        var opts = options.imageVersions[version];
                        var originalFileName = fileInfo.name;
                        var frameNr = '[20]';
                        if (options.documentTypes.test(fileInfo.name)) {
                            frameNr = '[0]';
                        }
                        var frameFileName = groupFileSystem.mediaUploadDir + '/' + fileInfo.name + frameNr;
                        var thumbName = groupFileSystem.mediaUploadDir + '/' + version + '/' + util.thumbNameProper(originalFileName);
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
                console.error(e);
            }
        ).on('progress',
            function (bytesReceived, bytesExpected) {
                if (bytesReceived > options.maxPostSize) {
                    handler.req.connection.destroy();
                }
            }
        ).on('end', finish).parse(handler.req);
    };
};

var pathRegExp = new RegExp('\/files\/([^/]*)(.*)');

var serve = function (storage, pathMatch, req, res) {
    req.groupIdentifier = pathMatch[1];
    req.url = pathMatch[2].length ? pathMatch[2] : '/';

    util.authenticatedGroup(req.groupIdentifier, ['Administrator', 'Member'], req, res, function() {

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
                console.log('redirect');
                res.writeHead(302, {
                    'Location': redirect.replace(/%s/, encodeURIComponent(JSON.stringify(result)))
                });
                res.end();
            }
            else {
                console.log('ok');
                res.writeHead(200, {
                    'Content-Type': req.headers.accept.indexOf('application/json') !== -1 ?
                        'application/json' : 'text/plain'
                });
                res.end(JSON.stringify(result));
            }
        });

        console.log('the media upload dir', groupFileSystem.mediaUploadDir);

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
    });
};

var ServerWithStorage = function(storage) {
    this.storage = storage;
    this.serve = function(req, res, next) {
        var pathMatch = pathRegExp.exec(req.url);
        if (pathMatch) {
            serve(storage, pathMatch, req, res);
        }
        else {
            next();
        }
    }
};

module.exports = function(storage) {
    return new ServerWithStorage(storage);
};
