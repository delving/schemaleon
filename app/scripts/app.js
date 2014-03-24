/*
 Copyright 2014 Delving BV, Rotterdam, Netherlands

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

var OSCR = angular.module('OSCR', ['ngRoute','ngCookies', 'ui.bootstrap', 'blueimp.fileupload','md5', 'ui-gravatar', 'ngPDFViewer']);

/**
 * This is the main file which puts the building blocks in place for the remainder.
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

OSCR.config(
    function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/public.html',
                controller: 'PublicController',
                title: 'OSCR Home'
            })
            .when('/login', {
                templateUrl: 'views/login.html',
                title: 'OSCR Login'
            })
            .when('/community', {
                templateUrl: 'views/community.html',
                controller: 'CommunityController',
                title: 'OSCR Community'
            })
            .when('/shared/:schema', {
                templateUrl: 'views/document-list.html',
                controller: 'DocumentListController'
            })
            .when('/shared/:schema/create', {
                templateUrl: 'views/document-edit.html'
            })
            .when('/shared/:schema/:identifier/edit', {
                templateUrl: 'views/document-edit.html'
            })
            .when('/primary/:schema/:groupIdentifier', {
                templateUrl: 'views/document-list.html',
                controller: 'DocumentListController'
            })
            .when('/primary/:schema/:groupIdentifier/create', {
                templateUrl: 'views/document-edit.html'
            })
            .when('/primary/:schema/:groupIdentifier/:identifier/edit', {
                templateUrl: 'views/document-edit.html'
            })
            .when('/primary/:schema/:groupIdentifier/:identifier/view', {
                templateUrl: 'views/document-view.html',
                controller: 'TreeController'
            })
            .when('/vocab/:vocab', {
                templateUrl: 'views/vocab.html',
                controller: 'VocabularyEditController'
            })
            .when('/lang/:lang', {
                templateUrl: 'views/lang.html',
                controller: 'LangEditController'
            })
            .when('/media', {
                templateUrl: 'views/media.html',
                controller: 'MediaController'
            })
            .when('/people', {
                templateUrl: 'views/people.html',
                controller: 'PeopleController'
            })
            .when('/people/group/:identifier', {
                templateUrl: 'views/group.html',
                controller: 'GroupViewController'
            })
            .when('/people/user/:identifier', {
                templateUrl: 'views/user.html',
                controller: 'UserViewController'
            })
            .otherwise({
                templateUrl: 'views/public.html',
                controller: 'PublicController',
                title: 'OSCR Home'
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

        $httpProvider.interceptors.push(function($q, $rootScope) {
            function reportError(message) {
                console.error(message);
                $rootScope.setGlobalError(message);
            }

            return {
                'responseError': function(rejection) {
                    var error = xmlToObject(rejection.data);
                    if (error.Error) {
                        error = error.Error;
                        switch (rejection.status) {
                            case 403:
                                // todo politely inform them
                                reportError(rejection.status + ":" + error);
                                break;
                            case 500:
                                // todo: apologize
                                reportError(rejection.status + ":" + error);
                                break;
                            default:
                                reportError(rejection.status + ":" + error);
                                break;
                        }
                    }
                    else {
                        reportError(rejection.status);
                    }
                    return $q.reject(rejection);
                }
            };
        });

    }
);
