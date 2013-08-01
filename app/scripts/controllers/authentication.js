'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.controller('AuthenticationController',
    ['$rootScope',
        function ($rootScope) {

            $rootScope.user = {
                userName: 'Zemyatin',
                fullName: 'Yvgeny Zemyatin',
                loggedIn: true
            };


     }]
);