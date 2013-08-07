'use strict';

angular.module('CultureCollectorApp').service(
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
    }
);
