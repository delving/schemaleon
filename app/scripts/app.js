'use strict';

angular.module('CultureCollectorApp', ['ui.bootstrap'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/dashboard', {
                templateUrl: 'views/dashboard.html'
            })
            .when('/object/', {
                templateUrl: 'views/document.html',
                controller: 'DocumentController'
            })
            .when('/object/:id', {
                templateUrl: 'views/document.html',
                controller: 'DocumentController'
            })
            .otherwise({
                redirectTo: '/index.html',
                templateUrl: 'views/dashboard.html'
            });
    }]);
