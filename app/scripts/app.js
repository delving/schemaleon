'use strict';

angular.module('CultureCollectorApp', ['ui.state','ui.bootstrap.tooltip','ui.bootstrap.popover','ui.bootstrap.typeahead'])
//    .config(['$routeProvider', function ($routeProvider) {
//        $routeProvider
//            .when('/', {
//            templateUrl: 'views/dashboard.html',
//            controller: 'ObjectEditController'
//            })
//            .when('/list/', {
//                templateUrl: 'views/list.html',
//                controller: 'ObjectListController'
//            })
//            .when('/object/', {
//                templateUrl: 'views/object.html',
//                controller: 'ObjectEditController'
//            })
//            .otherwise({
//                redirectTo: '/',
//                controller: 'ObjectEditController'
//            });
//    }]);
    .config(['$stateProvider', '$routeProvider', function($stateProvider, $urlRouteProvider) {
        $urlRouteProvider.otherwise("/");
        $stateProvider
            .state('dashboard', {
                url: "/",
                templateUrl: "views/dashboard.html",
                data: {

                }
            })
            .state('list', {
                url: '/list',
                templateUrl: 'views/list.html',
                controller: 'ObjectListController'
            })
            .state('object', {
                url: '/object',
                templateUrl: 'views/object.html',
                controller: 'ObjectEditController'
            })
    }]);
