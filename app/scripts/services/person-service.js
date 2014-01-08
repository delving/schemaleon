'use strict';

angular.module('OSCR').service(
    "Person",
    function ($rootScope, $http) {

        this.roles = [
            'Administrator', 'Member'
        ];

        this.authenticate = function (username, password, accept) {
            $http.post('/authenticate', { username: username, password: password }).success(function (xml) {
                var userObject = xmlToObject(xml);
                accept(userObject);
            });
        };

        this.getStats = function(accept) {
            $http.get('/person/stats').success(function (xml) {
                accept(xmlToObject(xml));
            });
        };

        this.selectUsers = function (query, accept) {
            $http.get('/person/user/select', {params: {q: query}}).success(function (xml) {
                accept(xmlToArray(xml));
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

        this.selectGroups = function (query, accept) {
            $http.get('/person/group/select', {params: {q: query}}).success(function (xml) {
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
                accept(xmlToObject(xml));
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

        this.refreshSchemas = function (accept) {
            $http.get('/refreshSchemas').success(function (xml) {
                accept(xmlToObject(xml));
            });
        };

    }
);
