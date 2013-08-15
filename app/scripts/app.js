'use strict';

var OSCR = angular.module('OSCR', ['ngCookies', 'ui.bootstrap', 'blueimp.fileupload']);

OSCR.config(
    function ($routeProvider) {
        $routeProvider
            .when('/dashboard', {
                templateUrl: 'views/dashboard.html',
                title: 'OSCR Dashboard'
            })
            .when('/document', {
                templateUrl: 'views/document-list.html',
                controller: 'DocumentListController'
            })
            .when('/document/:id', {
                templateUrl: 'views/document-list.html',
                controller: 'DocumentListController'
            })
            .when('/document/view/:id', {
                templateUrl: 'views/document-view.html',
                controller: 'DocumentViewController'
            })
            .when('/media', {
                templateUrl: 'views/media.html',
                controller: 'MediaUploadController'
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
    }
);

OSCR.config(
    function ($httpProvider, fileUploadProvider) {

        // for fileUploadProvider
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
        fileUploadProvider.defaults.redirect = window.location.href.replace(
            /\/[^\/]*$/,
            '/cors/result.html?%s'
        );

        // for general intercepting
        $httpProvider.responseInterceptors.push(function ($q) {
            function showNetworkProblem(problem) {
                alert("Network problem. See console for details.");
                console.log(problem);
            }

            function onSuccess(response) {
                if ("success_condition") {
//                    if (response.headers('Content-Type').indexOf("xml") > 0) {
//                        if (_.isArray(response.data)) {
//                            console.log("XML ARRAY "+response.headers('Content-Type'));
//                            console.log(response.data[0]);
//                        }
//                        else {
//                            console.log("XML "+response.headers('Content-Type'));
//                            console.log(response);
//                        }
//                    }
//                    else {
//                        if (_.isArray(response.data)) {
//                            console.log("ARRAY NOT XML but " + response.headers('Content-Type'));
//                            console.log(response.data[0]);
//                        }
//                    }
                    return response;
                }
                else {
                    showNetworkProblem(response.data);
                    $q.reject(response);
                    return null;
                }
            }

            function onError(response) {
                showNetworkProblem(response.data);
                $q.reject(response);
            }

            return function (promise) {
                return promise.then(onSuccess, onError);
            };
        });
    }
);
