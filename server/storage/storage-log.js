'use strict';

var _ = require('underscore');
var util = require('../util');

module.exports = Log;

function Log(storage) {
    this.storage = storage;
}

var P = Log.prototype;

P.activity = function (req, entry) {
    var s = this.storage;
    entry.Who = req.session.Identifier;
    entry.TimeStamp = (new Date()).getTime();
    var activityXml = util.objectToXml(entry, 'Activity');
    s.update(
        'insert activity entry',
        "insert node (" + activityXml + ") into " + s.activityPath() + '/Activities',
        function (result) {
            if (!result) {
                var entries = { Activity: [entry] };
                var entriesXml = util.objectToXml(entries, 'Activities');
                s.add(
                    'creating new activity file',
                    s.activityDocument(),
                    entriesXml,
                    function (xml) {
                        console.log("new activity file:\n" + xml);
                    }
                );
            }
        }
    );
};

P.chat = function (req, entry) {
    var s = this.storage;
    entry.Who = req.session.Identifier;
    entry.TimeStamp = (new Date()).getTime();
    var chatXml = util.objectToXml(entry, 'ChatMessage');
    s.update(
        'insert chat entry',
        "insert node (" + chatXml + ") into " + s.chatPath() + '/ChatMessages',
        function (result) {
            if (!result) {
                var entries = { ChatMessage: [entry] };
                var entriesXml = util.objectToXml(entries, 'ChatMessages');
                s.add(
                    'creating new chat file',
                    s.chatDocument(),
                    entriesXml,
                    function (xml) {
                        console.log("new chat file:\n" + xml);
                    }
                );
            }
        }
    );
};

P.getActivityEntries = function (receiver) {
    var s = this.storage;
    s.query(
        'fetch log entries',
        s.activityPath(),
        receiver
    );
};
