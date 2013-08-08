'use strict';

angular.module('OSCR').service(
    "Person",
    function ($http) {

        this.roles = [
            'Member', 'Administrator'
        ];

        this.authenticate = function (username, password, receiver) {
            $http.post('/authenticate', { username: username, password: password }).success(
                function (userXml, status, headers, config) {
                    var userObject = xmlToObject(userXml);
//                    console.log("received user object");
//                    console.log(userObject);
                    receiver(userObject.User.Profile);
                }
            ).error(
                function (data, status, headers, config) {
                    alert('Problem authenticating');
                }
            );
        };

        this.selectUsers = function (query, acceptList) {
            $http.get('/person/user/select', {params: {q: query}})
                .success(function (usersXml, status, headers, config) {
                    var userList = xmlToArray(usersXml);
                    acceptList(userList);
                })
                .error(function (data, status, headers, config) {
                    alert("Problem accessing users");
                });
        };

        this.getUser = function (email, acceptGroup) {
            $http.get('/person/user/fetch/'+email)
                .success(function (userXml, status, headers, config) {
                    var userObject = xmlToObject(userXml);
                    acceptGroup(userObject);
                })
                .error(function (data, status, headers, config) {
                    alert("Problem accessing groups");
                });
        };

        this.selectGroups = function (query, acceptList) {
            $http.get('/person/group/select', {params: {q: query}})
                .success(function (groupsXml, status, headers, config) {
                    var groupList = xmlToArray(groupsXml);
                    acceptList(groupList);
                })
                .error(function (data, status, headers, config) {
                    alert("Problem accessing groups");
                });
        };

        this.getGroup = function (identifier, acceptGroup) {
            $http.get('/person/group/fetch/'+identifier)
                .success(function (groupXml, status, headers, config) {
                    var groupObject = xmlToObject(groupXml);
                    acceptGroup(groupObject);
                })
                .error(function (data, status, headers, config) {
                    alert("Problem accessing groups");
                });
        };

        this.saveGroup = function (group, acceptGroup) {
            // group should have Name and Address (for now)
            console.log('about to save group:');
            console.log(group);
            $http.post('/person/group/save', group).success(
                function (groupXml, status, headers, config) {
                    var groupObject = xmlToObject(groupXml);
                    console.log("received group object just saved");
                    console.log(groupObject);
                    acceptGroup(groupObject);
                }
            ).error(
                function (data, status, headers, config) {
                    alert('Problem saving group');
                }
            );
        };

        this.getUsersInGroup = function (identifier, acceptList) {
            $http.get('/person/group/' + identifier + '/users')
                .success(function (usersXml, status, headers, config) {
                    var groupList = xmlToArray(usersXml);
                    acceptList(groupList);
                })
                .error(function (data, status, headers, config) {
                    alert("Problem accessing groups/users");
                });
        };

        this.addUserToGroup = function (identifier, role, email, acceptUser) {
            $http.post('/person/group/' + identifier + '/add', { role: role, email: email }).success(
                function (userXml, status, headers, config) {
                    var userObject = xmlToObject(userXml);
                    console.log("received user object");
                    console.log(userObject);
                    acceptUser(userObject.User.Profile);
                }
            ).error(
                function (data, status, headers, config) {
                    alert('Problem assigning user to group');
                }
            );
        };

        this.removeUserFromGroup = function (identifier, role, email, acceptUser) {
            $http.post('/person/group/' + identifier + '/remove', { role: role, email: email }).success(
                function (userXml, status, headers, config) {
                    var userObject = xmlToObject(userXml);
                    console.log("received user object");
                    console.log(userObject);
                    acceptUser(userObject.User.Profile);
                }
            ).error(
                function (data, status, headers, config) {
                    alert('Problem removing user from group');
                }
            );
        };
    }
);
