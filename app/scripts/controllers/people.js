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

        $scope.groupCreated = false;
        $scope.userAssigned = false;
        $scope.roles = _.map(Person.roles, function (role) {
            return { name: role }
        });

        function getAllGroups() {
            Person.getAllGroups(function(list){
                $scope.groupList = list;
                console.log(list);
            });
        }

        getAllGroups();

        function getAllUsers() {
            Person.getAllUsers(function(list){
                $scope.allUsers = list;
            });
        };

        getAllUsers();

        $scope.getUsersFromGroup = function (identifier) {
            Person.getUsersInGroup(identifier, function(list){
                return list;
                console.log(list);
            });
        }

//        getUsers('OSCR-GR-7oi1vbw-3gg');

        $scope.getUsersForGroup = function (identifier){
            Person.getUsersInGroup(identifier, function(list){
                return list;
                console.log(list);
            });
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

//        $scope.typeAheadGroups = function (query) {
//            var deferred = $q.defer();
//            Person.selectGroups(query, function (list) {
//                deferred.resolve(list);
//            });
//            return deferred.promise;
//        };
        $scope.typeAheadGroups = function (query) {
            var search = query.toLowerCase();
            // create a list of groups matching the user input
            var selectedGroups = _.filter($scope.groupList, function(group) {
                return group.Name.toLowerCase().indexOf(search) >= 0;
            });
            // if no groups match the typed input then return all available groups
            if (!selectedGroups.length){
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
                }, 4000);

            });
            getAllGroups();
        };

        $scope.assignUserToGroup = function () {
            var profile = $scope.chosenUser.Profile;
            Person.addUserToGroup($scope.chosenGroup.Identifier, $scope.chosenRole.name, profile.email, function (profile) {
                $scope.userAssigned = true;
                $timeout(function () {
                    $scope.userAssigned = false;
                }, 4000);
            })
        };

    }
);