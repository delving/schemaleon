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
    'PeopleController',
    function ($rootScope, $scope, $q, $location, Person, $timeout, $cookieStore) {

        $scope.selectedGroup = {};

        $scope.groupCreated = false;
        $scope.userAssigned = false;
        $scope.roles = _.map(Person.roles, function (role) {
            return { name: role }
        });

        function getAllGroups() {
            Person.getAllGroups(function (list) {
                $scope.groupList = list;
//                console.log(list);
            });
        }

        getAllGroups();

        function getAllUsers() {
            Person.getAllUsers(function (list) {
                $scope.allUsers = list;
                console.log($scope.allUsers);
            });
        }

        $scope.canUserAdministrate = function(groupIdentifier) {
            if ($rootScope.user && $rootScope.user.Memberships) {
                var memberships = $rootScope.user.Memberships.Member;
                if (memberships) {
                    var membership = _.filter(xmlArray(memberships), function(membership) {
                        return membership.Group === groupIdentifier;
                    });
                    if (membership.length) return true;
                    membership = _.filter(xmlArray(memberships), function(membership) {
                        return membership.Group === 'OSCR' && membership.Role === 'Administrator'; // true if they are god
                    });
                    if (membership.length) return true;
                }
            }
            return false;
        };

        $scope.populateGroup = function (group) {
            Person.getUsersInGroup(group.Identifier, function (list) {
                _.each(list, function (user) {
                    if (_.isArray(user.Memberships.Member)) {
                        _.each(user.Memberships.Member, function (membership) {
                            if (membership.Group === group.Identifier) {
                                user.GroupMember = membership;
                            }
                        });
                    }
                    else {
                        var membership = user.Memberships.Member;
                        if (membership.Group === group.Identifier) {
                            user.GroupMember = membership;
                        }
                    }
                });

                group.userList = list;
            });

            $scope.selectedGroup.Identifier = group.Identifier;
            $scope.selectedGroup.Name = group.Name;
        }

        $scope.typeAheadUsers = function (query) {
            var deferred = $q.defer();
            Person.selectUsers(query, function (list) {
                deferred.resolve(list);
            });
            return deferred.promise;
        };

        $scope.userToString = function (user) {
            if (!user) {
                return [];
            }
            return user.Profile.email + ' - ' + user.Profile.firstName + ' ' + user.Profile.lastName;
        };

        $scope.typeAheadGroups = function (query) {
            var search = query.toLowerCase();
            // create a list of groups matching the user input
            var selectedGroups = _.filter($scope.groupList, function (group) {
                return group.Name.toLowerCase().indexOf(search) >= 0;
            });
            // if no groups match the typed input then return all available groups
            if (!selectedGroups.length) {
                selectedGroups = $scope.groupList;
            }
            return selectedGroups;
        };

        $scope.groupToString = function (group) {
            if (!group) {
                return [];
            }
            return group.Name;
        };


        $scope.creatingGroup = false;
        $scope.newGroupToggle = function () {
            $scope.creatingGroup = !$scope.creatingGroup;
        };

        $scope.addingUser = false;
        $scope.addUserToggle = function (role) {
            console.log(role);
            $scope.selectedGroup.Role = role;
            $scope.addingUser = !$scope.addingUser;
        };

        $scope.createGroup = function () {
            var group = {
                Name: $scope.groupName,
                Address: $scope.groupAddress
            };
            Person.saveGroup(group, function (groupObject) {
                $scope.groupCreated = true;
                $scope.groupName = '';
                $scope.groupAddress = '';
                $timeout(function () {
                    $scope.groupCreated = false;
                    $scope.creatingGroup = false;
                }, 4000);

            });
            getAllGroups();
        };

        $scope.assignUserToGroup = function () {
            var profile = $scope.chosenUser.Profile;
            console.log($scope.selectedGroup);
            var identifier = $scope.selectedGroup.Identifier;
            Person.addUserToGroup($scope.selectedGroup.Identifier, $scope.selectedGroup.Role, profile.email, function (profile) {
                $scope.userAssigned = true;
                $scope.chosenUser = '';
                _.each($scope.groupList, function (group) {
                    if (group.Identifier === identifier) {
                        $scope.populateGroup(group);
                    }
                });
                $timeout(function () {
                    $scope.userAssigned = false;
                    $scope.addingUser = false;
                }, 4000);
            })
        };

        $scope.removeUserFromGroup = function (user) {
            Person.removeUserFromGroup($scope.selectedGroup.Identifier, user.GroupMember.Role, user.Profile.email, function () {
                console.log("user removed");
                _.each($scope.groupList, function (group) {
                    if (group.Identifier === $scope.selectedGroup.Identifier) {
                        $scope.populateGroup(group);
                    }
                });
            })
        };

    }
);