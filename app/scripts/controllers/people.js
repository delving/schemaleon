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
    function ($rootScope, $scope, $q, $location, Person, $timeout) {

        $rootScope.checkLoggedIn();

        $scope.administratorRole = 'Administrator';
        $scope.selectedGroup = {};
        $scope.chosenUser = null;
        $scope.groupCreated = false;
        $scope.userAssigned = false;
        $scope.roles = _.map(Person.roles, function (role) {
            return { name: role }
        });

        function getAllGroups() {
            Person.getAllGroups(function (list) {
                $scope.groupList = list;
            });
        }

        getAllGroups();

        function getAllUsers() {
            Person.getAllUsers(function (list) {
                $scope.allUsers = list;
            });
        }
        
        $('#dd-group-select').on('change', function () {
            var group = JSON.parse($(this).val());
            $scope.populateGroup(group);
        });

        $scope.canUserAdministrate = function (groupIdentifier) {
            if (!$rootScope.user || !$rootScope.user.Membership) return false;
            var m = $rootScope.user.Membership;
            if (m.GroupIdentifier == 'OSCR' && m.Role == $scope.administratorRole) return true; // gods
            return m.GroupIdentifer == groupIdentifier && m.Role == $scope.administratorRole;
        };

        $scope.populateGroup = function (group) {
            Person.getUsersInGroup(group.Identifier, function (list) {
                // todo: UserList should not start with a capital
                $scope.selectedGroup.UserList = list;
            });
            $scope.selectedGroup.Identifier = group.Identifier;
            $scope.selectedGroup.Name = group.Name;
        };

        $scope.typeAheadUsers = function (query) {
            var deferred = $q.defer();
            Person.selectUsers(query, function (list) {
                // todo: do this in a query
                var filtered = _.filter(list, function(user) {
                    return !user.Membership;
                });
                deferred.resolve(filtered);
            });
            return deferred.promise;
        };

        $scope.userToString = function (user) {
            if (!user) return '';
            return user.Profile.firstName + ' ' + user.Profile.lastName + ' <' + user.Profile.email + '>';
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
        $scope.addingUser = false;

        $scope.newGroupToggle = function () {
            $scope.creatingGroup = !$scope.creatingGroup;
            $scope.addingUser = false;
        };

        $scope.addUserToggle = function (role) {
            console.log(role);
            if (!role) {
                $scope.addingUser = false;
                return;
            }
            $scope.selectedGroup.Role = role;
            $scope.addingUser = true;
            $scope.creatingGroup = false;
        };

        $scope.createGroup = function () {
            var group = {
                Name: $scope.groupName,
                StreetAndNr: $scope.groupStreetAndNr,
                Zip: $scope.groupZip,
                City: $scope.groupCity,
                Description: $scope.groupDescription
            };
            // todo: make XML from the group and send that instead
            Person.saveGroup(group, function (groupObject) {
                $scope.groupCreated = true;
                $scope.groupName = '';
                $scope.groupStreetNameAndNr = '';
                $scope.groupZip = '';
                $scope.groupCity = '';
                $scope.groupDescription = '';
                $timeout(function () {
                    $scope.groupCreated = false;
                    $scope.creatingGroup = false;
                }, 4000);
                getAllGroups();
            });
        };

        $scope.assignUserToGroup = function () {
            Person.addUserToGroup(
                $scope.chosenUser.Identifier,
                $scope.selectedGroup.Role,
                $scope.selectedGroup.Identifier,
                function (xml) {
                    $scope.userAssigned = true;
                    $scope.chosenUser = null;
                    _.each($scope.groupList, function (group) {
                        if (group.Identifier === $scope.selectedGroup.Identifier) {
                            $scope.populateGroup(group);
                        }
                    });
                    $timeout(function () {
                        $scope.userAssigned = false;
                    }, 4000);
                }
            )
        };

        $scope.clearChosenUser = function () {
            $scope.chosenUser = null;
            $('input#cu').focus();
        };

        $scope.removeUserFromGroup = function (user) {
            Person.removeUserFromGroup(
                user.Identifier,
                user.Membership.Role,
                $scope.selectedGroup.Identifier,
                function () {
                    console.log("user removed");
                    _.each($scope.groupList, function (group) {
                        if (group.Identifier === $scope.selectedGroup.Identifier) {
                            $scope.populateGroup(group);
                        }
                    });
                }
            )
        };

    }
);