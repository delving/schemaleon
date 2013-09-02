'use strict';

var _ = require('underscore');
var util = require('../util');

module.exports = Log;

function Log(storage) {
    this.storage = storage;
}

var P = Log.prototype;

P.add = function (req, entry) {
    var s = this.storage;
    entry.Who = req.session.Identifier;
    entry.TimeStamp = (new Date()).getTime();
    var logXml = util.objectToXml(entry, 'Log');
    s.update(
        'insert log entry',
        "insert node (" + logXml + ") into " + s.logPath() + '/Entries',
        function (result) {
            if (!result) {
                var entries = { Log: [entry] };
                var entriesXml = util.objectToXml(entries, 'Entries');
                s.add(
                    'creating new log file',
                    s.logDocument(),
                    entriesXml,
                    function (xml) {
                        console.log("new log file:\n" + xml);
                    }
                );
            }
        }
    );
};

P.getEntries = function (receiver) {
    var s = this.storage;
    s.query(
        'fetch log entries',
        s.logPath(),
        receiver
    );
};
