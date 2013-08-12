'use strict';

angular.module('OSCR').service(
    "Person",
    function ($http) {

        this.roles = [
            'Administrator', 'Member'
        ];

        this.authenticate = function (username, password, accept) {
            $http.post('/authenticate', { username: username, password: password }).success(function (xml) {
                var userObject = xmlToObject(xml);
                accept(userObject.User.Profile);
            });
        };

        this.selectUsers = function (query, accept) {
            $http.get('/person/user/select', {params: {q: query}}).success(function (xml) {
                accept(xmlToArray(xml));
            });
        };

        this.getUser = function (email, accept) {
            $http.get('/person/user/fetch/' + email).success(function (xml) {
                accept(xmlToObject(xml));
            });
        };

        this.selectGroups = function (query, accept) {
            $http.get('/person/group/select', {params: {q: query}}).success(function (xml) {
                accept(xmlToArray(xml));
            });
        };

        this.getGroup = function (identifier, accept) {
            $http.get('/person/group/fetch/' + identifier).success(function (xml) {
                accept(xmlToObject(xml));
            });
        };

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

        this.addUserToGroup = function (identifier, role, email, accept) {
            $http.post('/person/group/' + identifier + '/add', { role: role, email: email }).success(function (xml) {
                var userObject = xmlToObject(xml);
                accept(userObject.User.Profile);
            });
        };

        this.removeUserFromGroup = function (identifier, role, email, accept) {
            $http.post('/person/group/' + identifier + '/remove', { role: role, email: email }).success(function (xml) {
                var userObject = xmlToObject(xml);
                accept(userObject.User.Profile);
            });
        };
    }
);