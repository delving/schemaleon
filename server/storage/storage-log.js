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

'use strict';

var _ = require('underscore');
var util = require('../util');

/*
 * These methods allow for storing chat messages and activities in BaseX, as well as for fetching
 * the activities from today.
 *
 * Document names depend on the timestamp because there is a new file referred-to every day.
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

module.exports = Log;

function Log(storage) {
    this.storage = storage;
}

var P = Log.prototype;

// record an activity entry
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

// get toda's activity entries
P.getActivityEntries = function (receiver) {
    var s = this.storage;
    s.query(
        'fetch log entries',
        s.activityPath(),
        receiver
    );
};

// record a chat entry
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

