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

/**
 * Service for accessing info about people and groups
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

angular.module('Schemaleon').service(
    "Person",
    function ($rootScope, $http) {

        this.roles = [
            'Administrator', 'Member', 'Viewer'
        ];

        this.authenticate = function (username, password, accept) {
            $http.post('/authenticate', { username: username, password: password }).success(function (xml) {
                var userObject = xmlToObject(xml);
                console.log("authenticate returns", userObject);
                if (userObject.User) {
                    accept(userObject.User);
                }
                else {
                    accept(null);
                }
            });
        };

        this.publishChatMessage = function(message, accept) {
            $http.get('/person/chat', {params: {message: message}}).success(accept);
        };

        this.getStats = function(accept) {
            $http.get('/person/stats').success(function (xml) {
                accept(xmlToObject(xml));
            });
        };

        this.getUser = function (identifier, accept) {
            $http.get('/person/user/fetch/' + identifier).success(function (xml) {
                accept(xmlToObject(xml).User);
            });
        };

        this.getAllUsers = function(accept){
            $http.get('/person/user/all').success(function (xml) {
                accept(xmlToArray(xml));
            });
        };

        this.getAllGroups = function (accept) {
            $http.get('/person/group/all').success(function (xml) {
                accept(xmlToArray(xml));
            });
        };

        this.getGroup = function (identifier, accept) {
            $http.get('/person/group/fetch/' + identifier).success(function (xml) {
                accept(xmlToObject(xml).Group);
            });
        };

        // todo: the group should probably be XML here
        this.saveGroup = function (group, accept) {
            // group should have Name and Address (for now)
            $http.post('/person/group/save', group).success(function (xml) {
                accept(xmlToObject(xml));
            });
        };

        this.getUsersInGroup = function (identifier, accept) {
            $http.get('/person/group/' + identifier + '/users').success(function (xml) {
                accept(xmlToArray(xml));
            });
        };

        this.addUserToGroup = function (userIdentifier, userRole, groupIdentifier, accept) {
            $http.post('/person/group/' + groupIdentifier + '/add', { userRole: userRole, userIdentifier: userIdentifier }).success(function (xml) {
                var userObject = xmlToObject(xml);
                console.log('received fresh user object'); // todo" remove
                console.log(userObject); // todo" remove
                accept(userObject.User.Profile);
            });
        };

        // todo: role is not used, because you just remove from the group
        this.removeUserFromGroup = function (userIdentifier, userRole, groupIdentifier, accept) {
            $http.post('/person/group/' + groupIdentifier + '/remove', { userRole: userRole, userIdentifier: userIdentifier }).success(function (xml) {
                var userObject = xmlToObject(xml);
                accept(userObject.User.Profile);
            });
        };

    }
);
