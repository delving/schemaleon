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
    function ($rootScope, $scope, $location, $cookieStore, $timeout, Person) {

        $scope.username = '';
        $scope.password = '';

        function setUser(user) {
            if (user) {
                $rootScope.user = user;
                $cookieStore.put('user', user);
                if ($rootScope.user.Memberships) {
                    $rootScope.user.Memberships.Membership = xmlArray($rootScope.user.Memberships.Membership);
                    _.each($rootScope.user.Memberships.Membership, function (membership) {
                        if (membership.GroupIdentifier === 'OSCR' && membership.Role === 'Administrator') {
                            $rootScope.user.god = true;
                        }
                    });
                }
            }
            else {
                delete $rootScope.user;
            }
        }

        $rootScope.login = function () {
            $scope.loginFailed = false;
            if ($scope.username && $scope.username.length) {
                Person.authenticate($scope.username, $scope.password, function (user) {
                    setUser(user);
                    if (user) {
                        $scope.choosePath('/dashboard');
                    }
                    else {
                        $scope.loginFailed = true;
                        $scope.password = '';
                        $scope.choosePath('/login');
                    }
                });
            }
            else {
                setUser({
                    Identifier: 'OSCR-US-fakey-id',
                    Profile: {
                        firstName: 'Oscr',
                        lastName: 'Wild',
                        email: 'oscr@delving.eu'
                    },
                    Memberships: {
                        Membership: [
                        ]
                    }
                });
                $scope.choosePath('/dashboard');
            }
        };

        $rootScope.refreshUser = function () {
            if ($rootScope.user) {
                Person.getUser($rootScope.user.Identifier, function (user) {
                    setUser(user);
                });
            }
        };

        $rootScope.$watch('user', function (user, before) {
            if (!user) return;
            $rootScope.userMemberships = [];
            if (user.Memberships) {
                _.each(user.Memberships.Membership, function (membership) {
                    Person.getGroup(membership.GroupIdentifier, function (group) {
                        membership.group = group.Group;
                        membership.Label = membership.group.Name + ' (' + membership.Role + ')';
                        $rootScope.userMemberships.push(membership);
                        user.groupIdentifier = membership.GroupIdentifier;
                    });
                });
            }
        });

        $rootScope.logout = function () {
            $cookieStore.remove('user');
            setUser(null);
            $scope.choosePath('/login');
        };

        if ($location.host() == 'localhost') {
            var user = $cookieStore.get('user');
            if (user) {
                setUser(user);
                var oscrPath = $cookieStore.get('oscr-path');
                if (oscrPath) {
                    $timeout(
                        function () {
                            $scope.choosePath(oscrPath);
                        },
                        300
                    );
                }
            }
        }
    }
);

OSCR.directive('enterKey', function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attr, ctrl) {
            elem.bind('keydown', function (e) {
                if (e.keyCode === 13) {
                    scope.$apply(function (s) {
                        s.$eval(attr.enterKey);
                    });
                }
            });
        }
    };
});
