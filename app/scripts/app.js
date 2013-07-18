'use strict';

angular.module('CultureCollectorApp', ['ui.bootstrap'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/dashboard', {
                templateUrl: 'views/dashboard.html'
            })
            .when('/list/', {
                templateUrl: 'views/document-list.html',
                controller: 'DocumentListController'
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
                redirectTo: '/',
                templateUrl: 'views/dashboard.html'
            });
    }]);
//    .config(['$stateProvider', '$routeProvider', function($stateProvider, $urlRouteProvider) {
//        $urlRouteProvider.otherwise("/");
//        $stateProvider
//            .state('dashboard', {
//                url: "/",
//                templateUrl: "views/dashboard.html",
//                data: {
//
//                }
//            })
//            .state('list', {
//                url: '/list',
//                templateUrl: 'views/list.html',
//                controller: 'ObjectListController'
//            })
//            .state('object', {
//                url: '/object',
//                templateUrl: 'views/object.html',
//                controller: 'ObjectEditController'
//            })
//    }]);
