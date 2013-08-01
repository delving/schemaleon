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
            .when('/login', {
                templateUrl: 'views/login.html'
            })
            .otherwise({
                redirectTo: 'views/index.html',
                templateUrl: 'views/public.html'
            });
    }]);
