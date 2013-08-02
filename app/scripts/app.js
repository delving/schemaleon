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
            .when('/document/view/:id', {
               templateUrl: 'views/document-view.html',
                controller: 'DocumentViewController'
            })
            .when('/login', {
                templateUrl: 'views/login.html'
            })
            .otherwise({
                redirectTo: 'index.html',
                templateUrl: 'views/public.html'
            });
    }]);
