'use strict';

angular.module('CultureCollectorApp', ['ui.bootstrap'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/dashboard', {
                templateUrl: 'views/dashboard.html'
            })
            .when('/document/', {
                templateUrl: 'views/document.html',
                controller: 'DocumentController'
            })
            .when('/document/:id', {
                templateUrl: 'views/document.html',
                controller: 'DocumentController'
            })
            .otherwise({
                redirectTo: '/index.html',
                templateUrl: 'views/login.html'
            });
    }]);
