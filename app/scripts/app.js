'use strict';

angular.module('CultureCollectorApp', ['ui.bootstrap'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/', {
            templateUrl: 'views/dashboard.html',
            controller: 'ObjectEditController'
            })
            .when('/list.html', {
                templateUrl: 'views/list.html',
                controller: 'ListCtrl'
            })
            .when('/object.html', {
                templateUrl: 'views/object.html',
                controller: 'ObjectEditController'
            })
            .otherwise({
                redirectTo: '/',
                controller: 'ObjectEditController'
            });
    }]);

