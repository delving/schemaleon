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

var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.controller('LoginController',
    [
        '$rootScope', '$scope', '$location',
        function ($rootScope, $scope, $location) {

            $rootScope.login = function () {
                if ($scope.usename && $scope.username.length) {
                    $rootScope.user = {
                        userName: $scope.username,
                        fullName: $scope.username
                    };
                }
                else {
                    $rootScope.user = {
                        userName: 'pretend',
                        fullName: 'Pretend User'
                    };
                }
                $location.path('/dashboard');
            };

            $rootScope.logout = function () {
                delete $rootScope.user;
                $location.path('/login');
            };
        }
    ]
);