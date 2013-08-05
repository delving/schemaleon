'use strict';

angular.module('CultureCollectorApp', ['ui.bootstrap'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/dashboard', {
                templateUrl: 'views/dashboard.html',
                title: 'OSCR Dashboard'
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
            .when('/fileupload', {
                templateUrl: 'views/file-upload.html',
//                controller: 'FileUploadController',
                title: 'OSCR File Upload'
            })
            .when('/login', {
                templateUrl: 'views/login.html'
            })
            .otherwise({
                redirectTo: 'index.html',
                templateUrl: 'views/public.html'
            });
    }]);
