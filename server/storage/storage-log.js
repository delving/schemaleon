// ================================================================================
// Copyright 2014 Delving BV, Rotterdam, Netherands
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.
// ================================================================================

'use strict';

/*

    These methods allow for storing chat messages and activities in BaseX, as well as for fetching
    the activities from today.

    Document names depend on the timestamp because there is a new file referred-to every day.

    Author: Gerald de Jong <gerald@delving.eu>

 */

var _ = require('underscore');
var util = require('../util');

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

