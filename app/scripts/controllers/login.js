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

OSCR.controller(
    'LoginController',
    function ($rootScope, $scope, $location, $cookieStore, Person) {

        $scope.username = '';
        $scope.password = '';

        function setUser(user) {
            if (user) {
                $rootScope.user = user;
                $rootScope.user.Memberships.Membership = xmlArray($rootScope.user.Memberships.Membership);
            }
        }

        $rootScope.login = function () {
            if ($scope.username && $scope.username.length) {
                Person.authenticate($scope.username, $scope.password, function (user) {
                    setUser(user);
                });
            }
            if (!$rootScope.user) {
                $rootScope.user = {
                    Profile: {
                        firstName: 'Oscr',
                        lastName: 'Wild',
                        email: 'oscr@delving.eu'
                    },
                    Memberships: {
                        Membership: []
                    }
                };
            }
            $location.path('/dashboard');
        };

        $rootScope.refreshUser = function() {
            if ($rootScope.user) {
                Person.getUser($rootScope.user.Profile.email, function(user) {
                    setUser(user);
                });
            }
        };

        $rootScope.$watch('user', function(after, before) {
            if (!after) return;
            _.each(after.Memberships.Membership, function(membership) {
                Person.getGroup(membership.GroupIdentifier, function(group) {
                    membership.group = group.Group;
                    Person.getUsersInGroup(membership.group.Identifier, function (list) {
                        membership.group.userList = list;
                    });
                });
            });
        });

        $rootScope.logout = function () {
            delete $rootScope.user;
            $location.path('/login');
        };
    }
);