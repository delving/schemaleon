'use strict';

angular.module('CultureCollectorApp').service(
    "Commons",
    function ($http) {
        this.authenticate = function (username, password, receiver) {
            $http.post('/authenticate', { username: username, password: password }).success(
                function (data, status, headers, config) {
                    receiver(data);
                }
            ).error(
                function (data, status, headers, config) {
                    alert('Problem authenticating');
                }
            );
        };
    }
);
