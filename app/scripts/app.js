'use strict';

angular.module('OSCR', ['ui.bootstrap','blueimp.fileupload'])
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
                controller: 'TestFileUploadController'
            })
            .when('/people', {
                templateUrl: 'views/people.html',
                controller: 'PeopleController'
            })
            .when('/login', {
                templateUrl: 'views/login.html',
                controller: 'LoginController'
            })
            .otherwise({ // todo: does this still exists?
                redirectTo: 'index.html',
                templateUrl: 'views/public.html'
            });
    }]);
