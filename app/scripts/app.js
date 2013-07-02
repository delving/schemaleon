'use strict';

angular.module('CultureCollectorApp', ['ui.bootstrap.tooltip','ui.bootstrap.popover','ui.bootstrap.typeahead'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/', {
            templateUrl: 'views/dashboard.html',
            controller: 'ObjectEditController'
            })
            .when('/list/', {
                templateUrl: 'views/list.html',
                controller: 'ObjectListController'
            })
            .when('/object/', {
                templateUrl: 'views/object.html',
                controller: 'ObjectEditController'
            })
            .otherwise({
                redirectTo: '/',
                controller: 'ObjectEditController'
            });
    }]);

