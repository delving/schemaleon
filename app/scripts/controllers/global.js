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

OSCR.controller('GlobalController',
    [
        '$rootScope', '$scope', '$location',
        function ($rootScope, $scope, $location) {


            // CONFIGURATION SETTINGS ================================================================

            $rootScope.config = {
                interfaceLanguages: [
                    {name: 'English', code: 'en'},
                    {name: 'Nederlands', code: 'nl'}
                ],
                interfaceLanguage: 'en',
                showInlinePreview: true,
                showTranslationEditor: false
            };

            $rootScope.toggleInlinePreview = function () {
                if ($rootScope.translating()) return;
                $rootScope.config.showInlinePreview = !$rootScope.config.showInlinePreview;
            };

            $rootScope.toggleTranslationEditor = function () {
                $rootScope.config.showTranslationEditor = !$rootScope.config.showTranslationEditor;
            };

            $rootScope.translating = function () {
                return $rootScope.config.showTranslationEditor;
            };

            // APPLICATION NAVIGATION ================================================================

            // just a little help to get rid of any logged in views for now
            // todo: you are still able to navigate to all the pages via the location bar in the browser
            if (!$rootScope.user) {
                $location.path('/login');
            }

            $scope.mainMenu = {
                links: [
                    {name: "Dashboard", path: "/dashboard", icon: 'icon-home', active: false},
                    {name: "People", path: "/people", icon: 'icon-user', active: false},
                    {name: "Documents", path: "/document", icon: 'icon-th-list', active: false},
                    {name: "File upload", path: "/fileupload", icon: 'icon-file', active: false}
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

            $scope.choosePath = function (path) {
                if ($rootScope.translating()) return;
                var activeItem = false;
                _.forEach($scope.mainMenu.links.concat($scope.recent), function (link) {
                    link.active = (link.path == path);
                    if (link.active) activeItem = true;
                });
                if (!activeItem && path.indexOf('OSCR') > 0) {
                    var identifier = path.substring(path.lastIndexOf("/") + 1, path.length);
                    var freshLabel = {
                        name: identifier,
                        path: path,
                        icon: 'icon-th-home',
                        active: true,
                        recent: true
                    };
                    $scope.recent.push(freshLabel);
                }
                $location.path(path);
            };

            $scope.getInclude = function () {
                if ($location.path().indexOf('/object/') >= 0) {
                    return "views/legend.html";
                }
                return "";
            };


        }
    ]
);