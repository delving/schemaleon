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

        $scope.groupList = [];
        $scope.userList = [];
        $scope.roles = _.map(Person.roles, function (role) {
            return { name: role }
        });
        $scope.membership = $rootScope.user.Membership;

        $scope.groupChoice = null;
        $scope.groupFindUser = null;
        $scope.creating = null;
        $scope.selectedUser = null;
        $scope.selectedGroup = {};
        $scope.newGroup = {};
        $scope.newUser = {};

        function refreshUsers() {
            Person.getAllUsers(function(list) {
                $scope.userList = list;
                console.log("users", list);
            });
        }

        function populateGroup(group) {
            Person.getUsersInGroup(group.Identifier, function (list) {
                $scope.selectedGroup.userList = list;
            });
            $scope.selectedGroup.Identifier = group.Identifier;
            $scope.selectedGroup.Name = group.Name;
        }

        if ($scope.membership.Role == 'Administrator') {
            if ($scope.membership.GroupIdentifier == 'Schemaleon') {
                Person.getAllGroups(function (list) {
                    $scope.groupList = list;
                });
                refreshUsers();
            }
            else {
                Person.getGroup($scope.membership.GroupIdentifier, function(group) {
                    console.log("group", group);
                    populateGroup(group);
                })
            }
        }

        $scope.typeAheadUsers = function (query, onlyOrphans) {
            var search = query.toLowerCase();

            console.log("before filter", $scope.userList);

            var selectedUsers = _.filter($scope.userList, function (user) {
                return user.Credentials.Username.toLowerCase().indexOf(search) >= 0;
            });

            console.log("selected users onlyOrphans="+onlyOrphans, selectedUsers);

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
            populateGroup(group);
            $scope.groupChoice = null;
        };

        $scope.selectGroupFromUser = function(user) {
            Person.getGroup(user.Membership.GroupIdentifier, function(group) {
                populateGroup(group);
                $scope.groupFindUser = '';
            });
        };

        $scope.userToString = function (user) {
            if (!user) return '';

            console.log("userToString", user);

            return user.Credentials.Username;
        };

        $scope.typeAheadGroups = function (query) {
            var search = query.toLowerCase();
            // create a list of groups matching the user input
            var selectedGroups = _.filter($scope.groupList, function (group) {
                return group.Name.toLowerCase().indexOf(search) >= 0;
            });
            // if no groups match the typed input then return all available groups
            if (!selectedGroups.length) selectedGroups = $scope.groupList;
            return selectedGroups;
        };

        $scope.groupToString = function (group) {
            if (!group) return '';
            return group.Name;
        };

        $scope.toggleNew = function(what) {
            $scope.creating = ($scope.creating == what) ? null: what;
        };

        $scope.addUserToggle = function (role) {
            console.log("add user role", role);
            if (!role) return;
            $scope.selectedGroup.Role = role;
            $scope.toggleNew('membership');
        };

        $scope.newGroupDisabled = true;
        $scope.$watch("newGroup", function(newGroup) {
            // todo: check against existing list
            $scope.newGroupDisabled = !newGroup || !newGroup.Name || (newGroup.Name.trim().length < 3);
        }, true);

        $scope.createGroup = function () {
//            console.log("### create group", $scope.newGroup);
            Person.saveGroup($scope.newGroup, function (groupObject) {
                $scope.newGroup = {};
                $scope.toggleNew(null);
                Person.getAllGroups(function (list) {
                    $scope.groupList = list;
                });
            });
        };

        $scope.newUserDisabled = true;
        $scope.$watch("newUser", function(newUser) {
            var disabled = true;
            if (newUser && newUser.Username) {
                var filtered = newUser.Username.trim().replace(/\W+/g, "-").replace(/[-]+/g, "-").toLowerCase();
                if (newUser.Username != filtered) newUser.Username = filtered;
                // todo: check against existing list
                disabled = newUser.Password != newUser.PasswordVerify || (newUser.Username.length < 3);
            }
            $scope.newUserDisabled = disabled;
        }, true);
        
        $scope.createUser = function () {
            var u = $scope.newUser;
            console.log("### create user", u);
            if (u.Password != u.PasswordVerify) {
                console.warn("password mismatch!");
                return;
            }
            Person.createUser(u.Username, u.Password, function(userObject) {
                $scope.newUser = {};
                $scope.toggleNew(null);
                refreshUsers();
            });
        };

        $scope.assignUserToGroup = function () {
            var u = $scope.selectedUser;
            var g = $scope.selectedGroup;
            Person.addUserToGroup(u.Identifier, g.Role, g.Identifier, function (xml) {
                refreshUsers();
            });
        };

        $scope.clearChosenUser = function () {
            $scope.selectedUser = null;
            $('input#cu').focus();
        };

        $scope.removeUserFromGroup = function (u) {
            var g = $scope.selectedGroup;
            Person.removeUserFromGroup(u.Identifier, u.Membership.Role, g.Identifier, function () {
                console.log("user removed");
                refreshUsers();
            });
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
