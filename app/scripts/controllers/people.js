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

var Schemaleon = angular.module('Schemaleon');

/**
 * Handle the people stuff, editing groups and viewing people and groups
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

Schemaleon.controller(
    'PeopleController',
    function ($rootScope, $scope, $q, $location, Person, $timeout) {

        $rootScope.checkLoggedIn();

        $scope.administratorRole = 'Administrator';
        $scope.selectedGroup = {};
        $scope.chosenUser = null;
        $scope.groupFindUser = null;
        $scope.groupCreated = false;
        $scope.userAssigned = false;
        $scope.groupList = [];
        $scope.userList = [];
        $scope.roles = _.map(Person.roles, function (role) {
            return { name: role }
        });
        $scope.membership = $rootScope.user.Membership;

        $scope.populateGroup = function (group) {
            Person.getUsersInGroup(group.Identifier, function (list) {
                $scope.selectedGroup.userList = list;
            });
            $scope.selectedGroup.Identifier = group.Identifier;
            $scope.selectedGroup.Name = group.Name;
        };

        if ($scope.membership.Role == $scope.administratorRole) {
            if ($scope.membership.GroupIdentifier == 'Schemaleon') {
                Person.getAllGroups(function (list) {
                    $scope.groupList = list;
                });
                Person.getAllUsers(function(list) {
                    $scope.userList = list;
                });
            }
            else {
                Person.getGroup($scope.membership.GroupIdentifier, function(group) {
                    console.log("group", group);
                    $scope.populateGroup(group);
                })
            }
        }

        $scope.typeAheadUsers = function (query, onlyOrphans) {

            var search = query.toLowerCase();

            console.log("type ahead user", query); // todo: remove

            var selectedUsers = _.filter($scope.userList, function (user) {
                return user.Credentials.Username.toLowerCase().indexOf(search) >= 0;
            });
            // todo: splice when it gets too big
            if (!selectedUsers.length) {
                selectedUsers = $scope.userList;
            }
            if (onlyOrphans) {
                return _.filter(selectedUsers, function (user) {
                    return !user.Membership;
                });
            }
            else {
                return _.filter(selectedUsers, function (user) {
                    return user.Membership;
                });
            }
        };

        $scope.selectGroup = function(group) {
            $scope.populateGroup(group);
            $scope.groupChoice = '';
        };

        $scope.selectGroupFromUser = function(user) {
            Person.getGroup(user.Membership.GroupIdentifier, function(group) {
                $scope.populateGroup(group);
                $scope.groupFindUser = '';
            });
        };

        $scope.userToString = function (user) {
            if (!user) return '';
            return user.Credentials.Username;
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
            if (!group) return '';
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
                Person.getAllGroups(function (list) {
                    $scope.groupList = list;
                });
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
                    Person.getAllUsers(function(list) {
                        $scope.userList = list;
                        _.each($scope.groupList, function (group) {
                            if (group.Identifier === $scope.selectedGroup.Identifier) {
                                $scope.populateGroup(group);
                            }
                        });
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
                    Person.getAllUsers(function(list) {
                        $scope.userList = list;
                        _.each($scope.groupList, function (group) {
                            if (group.Identifier === $scope.selectedGroup.Identifier) {
                                $scope.populateGroup(group);
                            }
                        });
                    });
                }
            )
        };

    }
);

Schemaleon.controller(
    'UserViewController',
    function ($rootScope, $scope, $routeParams, $location, $cookieStore, Person) {
        $scope.Identifier = $routeParams.identifier;

        Person.getUser($scope.Identifier, function(user) {
            $scope.userView = user;
            if (user.Membership) {
                Person.getGroup(user.Membership.GroupIdentifier, function (group) {
                    user.group = group;
                });
            }
        });
    }
);

Schemaleon.controller(
    'GroupViewController',
    function ($scope, $routeParams, Person) {

        $scope.identifier = $routeParams.identifier;

        Person.getGroup($scope.identifier, function(group) {
            $scope.group = group;
            Person.getUsersInGroup($scope.group.Identifier, function (list) {
                $scope.group.userList = list;
            });
        });
    }
);
