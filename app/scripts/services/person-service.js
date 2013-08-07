'use strict';

angular.module('OSCR').service(
    "Person",
    function ($http) {

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

        this.selectGroups = function (query, acceptList) {
            $http.get('/person/group/select', {params: {q: query}})
                .success(function (usersXml, status, headers, config) {
                    var groupList = xmlToArray(usersXml);
                    acceptList(groupList);
                })
                .error(function (data, status, headers, config) {
                    alert("Problem accessing groups");
                });
        };
    }
);
