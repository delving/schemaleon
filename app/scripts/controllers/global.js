/* ==========================================================
 * OSCR v.1.0
 * https://github.com/delving/oscr/app/scripts/global.js
 *
 * ==========================================================
 * Copyright 2013 Delving B.V.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */

var OSCR = angular.module('OSCR');

OSCR.directive('private',
    function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                scope.$watch(attrs.private, function (ok) {
                    if (!ok) {
                        element.text('');
                    }
                });
            }
        };
    }
);

OSCR.controller(
    'GlobalController',
    function ($rootScope, $cookieStore, $scope, $location, $routeParams, Person, I18N) {

        // CONFIGURATION SETTINGS ================================================================

        $rootScope.config = {
            interfaceLanguages: [
                {name: 'English', code: 'en'},
                {name: 'Nederlands', code: 'nl'},
                {name: 'Frysk', code: 'fy'},
                {name: 'Norsk', code: 'no'},
                {name: 'Svenska', code: 'sw'}
            ],
            interfaceLanguage: 'en',
            showInlinePreview: true,
            showTranslationEditor: false
        };

        $rootScope.toggleInlinePreview = function () {
            $rootScope.config.showInlinePreview = !$rootScope.config.showInlinePreview;
        };

        $rootScope.toggleTranslationEditor = function () {
            $rootScope.config.showTranslationEditor = !$rootScope.config.showTranslationEditor;
        };

        $rootScope.refreshSchemas = function() {
            Person.refreshSchemas(function (result) {
                alert('refreshed schemas');
            })
        };

        $rootScope.saveLanguage = function() {
            I18N.saveLanguage($rootScope.lang, function (lang) {
                $rootScope.i18n = lang;
                alert('saved language');
            })
        };

        // APPLICATION NAVIGATION ================================================================

        $rootScope.checkLoggedIn = function() {
            if ($location.path() != '/login' && !$rootScope.user) {
                $location.path('/login');
            }
        };

        $scope.mainMenu = {
            links: [
                {name: "Dashboard", path: "/dashboard", icon: 'icon-home', active: false},
                {name: "UserManagement", path: "/people", icon: 'icon-users', active: false},
                {name: "MediaUpload", path: "/media", icon: 'icon-upload', active: false},
                {name: "Photo", path: "/document/Photo", icon: 'icon-file', active: false},
                {name: "InMemoriam", path: "/document/InMemoriam", icon: 'icon-file', active: false},
                {name: "Book", path: "/document/Book", icon: 'icon-file', active: false},
                {name: "Video", path: "/document/Video", icon: 'icon-file', active: false},
                {name: "Location", path: "/document/Location", icon: 'icon-file', active: false}
            ]
        };
        $scope.recent = [];

        var anyActive = false;
        _.forEach($scope.mainMenu.links, function (link) {
            link.active = ($location.path().indexOf(link.path) >= 0);
            if (link.active) anyActive = true;
        });
        if (!anyActive) {
            $scope.mainMenu.links[0].active = true;
        }

        $scope.choosePath = function (path, header) {
//            console.log('PATH '+path);
            var activeItem = false;
            _.forEach($scope.mainMenu.links.concat($scope.recent), function (link) {
                link.active = (link.path == path);
                if (link.active) activeItem = true;
            });
            if (!activeItem && path.indexOf('/document') == 0 && path.indexOf('create') < 0) {
                var freshLabel = {
                    path: path,
                    icon: 'icon-th-home',
                    active: true,
                    recent: true
                };
                if (header) {
                    freshLabel.name = header.Title;
                }
                else {
                    freshLabel.name = path.substring(path.lastIndexOf("/") + 1, path.length);
                }
                $scope.recent.push(freshLabel);
                if ($scope.recent.length > 10) {
                    $scope.recent.shift();
                }
            }
            $location.path(path);
            $cookieStore.put('oscr-path', path);
        };

        $scope.useHeaderInMenu = function(header) {
            _.each($scope.recent, function(recent) {
                if (header.Identifier == recent.name) {
                    recent.name = header.Title;
                }
            });
        };

        $scope.sidebarShowing = function() {
            return $location.path() !== '/login';
        };

        $scope.getInclude = function () {
            if ($routeParams.identifier) { //todo: differently
                return "views/include/legend.html";
            }
            return "";
        };
    }
);