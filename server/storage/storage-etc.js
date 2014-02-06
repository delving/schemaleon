'use strict';

var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var defer = require('node-promise').defer;
var archiver = require('node-archiver');

module.exports = ETC;

function ETC(storage) {
    this.storage = storage;
    this.dataLoadCount = 0;
    this.promise = null;
}

var P = ETC.prototype;

// get the statistics for a group, or for primary of all groups
P.getStatistics = function (groupIdentifier, receiver) {
    var s = this.storage;
    var q = [];
    q.push("<Statistics>");
    q.push('  <People>');
    q.push('    <Person>{ count(' + s.userCollection() + ') }</Person>');
    q.push('    <Group>{ count(' + s.groupCollection() + ') }</Group>');
    q.push('  </People>');
    q.push('  <Shared>');
    _.each(s.schemaMap.shared, function(schema){
        q.push('  <Schema>');
        q.push('    <Name>'+schema+'</Name>');
        q.push('    <Count>{ count(' + s.dataCollection(schema, null) + ') }</Count>');
        q.push('  </Schema>');
    });
    q.push('  </Shared>');
    q.push('  <Primary>');
    _.each(s.schemaMap.primary, function(schema){
        q.push('  <Schema>');
        q.push('    <Name>'+schema+'</Name>');
        q.push('    <Count>{ count(' + s.dataCollection(schema, groupIdentifier) + ') }</Count>');
        q.push('  </Schema>');
    });
    q.push('  </Primary>');
    q.push('  <AllPrimary>');
    _.each(s.schemaMap.primary, function(schema){
        q.push('  <Schema>');
        q.push('    <Name>'+schema+'</Name>');
        q.push('    <Count>{ ' + s.dataDocumentCount(schema) + ' }</Count>');
        q.push('  </Schema>');
    });
    q.push('  </AllPrimary>');
    q.push("</Statistics>");
    s.query('get statistics', q, receiver);
};

P.snapshotName = function() {
    var now = new Date();
    var dateString = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() +
        '-' + now.getHours() + '-' + now.getMinutes();
    return 'OSCR-Snapshot-' + dateString + '.tgz';
};

P.snapshotCreate = function (fileName, receiver) {
    var s = this.storage;
    var match = fileName.match(/(.*)\.tgz/);
    if (!match) {
        console.error("File name mismatch " + fileName);
    }
    var fileBase = match[1];
    var exportPath = s.FileSystem.databaseSnapshotDir + '/' + fileBase;
    var archiveFile = exportPath + '.tgz';
    s.session.execute('export ' + exportPath, function () {

        function remove(itemPath) {
            if (fs.statSync(itemPath).isDirectory()) {
                _.each(fs.readdirSync(itemPath), function(childItemName) {
                    remove(path.join(itemPath, childItemName));
                });
                fs.rmdirSync(itemPath);
            }
            else {
                fs.unlinkSync(itemPath);
            }
        }

        archiver(exportPath, archiveFile, function(err) {
            if (err) {
                console.error(err);
            }
            receiver(archiveFile);
            remove(exportPath);
        });
    })
};

P.incrementLoadCount = function() {
    this.dataLoadCount = this.dataLoadCount + 1;
    if (this.dataLoadCount % 100 == 0) {
        console.log('loaded '+this.dataLoadCount);
    }
};

P.loadPromise = function(filePath, docPath, replace) {
    var self = this;
    var s = this.storage;
    var deferred = defer();
    fs.readFile(filePath, 'utf8', function (err, contents) {
        if (err) console.error(err);
        if (replace) {
            s.replace(null, docPath, contents, function (results) {
                self.incrementLoadCount();
//                        console.log('replaced ' + filePath + ' to ' + docPath);
                deferred.resolve(results);
            });
        }
        else {
            self.incrementLoadCount();
            s.add(null, docPath, contents, function (results) {
//                        console.log('added ' + filePath + ' to ' + docPath);
                deferred.resolve(results);
            });
        }
    });
    return deferred.promise;
};

P.loadData = function(fsPath, docPath, replace) {
    var self = this;
    var extension = ".xml";
    _.each(fs.readdirSync(fsPath), function (file) {
        if (file[0] == '.') return;
        var fileSystemPath = fsPath + '/' + file;
        var documentPath = docPath + file;
        if (fs.statSync(fileSystemPath).isDirectory()) {
            self.loadData(fileSystemPath, documentPath + '/', replace);
        }
        else if (file.lastIndexOf(extension) + extension.length == file.length) {
            if (self.promise) {
                self.promise = self.promise.then(function () {
                    return self.loadPromise(fileSystemPath, documentPath, replace);
                });
            }
            else {
                self.promise = self.loadPromise(fileSystemPath, documentPath, replace);
            }
        }
    });
};

P.loadBootstrapData = function (replace) {
    var dataPath = "../oscr-data";
    if (!fs.existsSync(dataPath)) {
        throw new Error("Cannot find "+dataPath+" for bootstrapping!");
    }
    dataPath = fs.realpathSync(dataPath);
    this.loadData(dataPath, '', replace);
    console.log('prepared to load bootstrap data');
    this.satisfyPromise("loading bootstrap data from oscr-data");
};

P.loadPrimaryData = function(replace) {
    var dataPath = "../oscr-primary-data";
    if (!fs.existsSync(dataPath)) {
        console.log("Cannot find " + dataPath + " for loading primary data.  Skipping.");
    }
    dataPath = fs.realpathSync(dataPath);
    this.loadData(dataPath, '/primary/', replace);
    this.satisfyPromise("loading primary data from oscr-primary-data replace=" + replace);
};

P.satisfyPromise = function(activity) {
    if (this.promise) {
        console.log("starting: " + activity);
        var goforit = this.promise;
        this.promise = null;
        goforit.then(
            function () {
                console.log("done: " + activity);
            },
            function (error) {
                console.error("problem with " + activity + ":" + error);
            }
        );
    }
};
