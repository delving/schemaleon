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
    function ($rootScope, $cookieStore, $timeout, $scope, $q, $location, $routeParams, Person, I18N) {

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

        $rootScope.toggleTranslationEditor = function () {
            $rootScope.config.showTranslationEditor = !$rootScope.config.showTranslationEditor;
        };

        $rootScope.saveLanguage = function() {
            I18N.saveLanguage($rootScope.lang, function (lang) {
                $rootScope.i18n = lang;
                alert('saved language');
            })
        };

        $rootScope.schemaMap =  {
            primary: [ "Photo", "Film", "Memoriam", "Publication" ],
            shared: [ "Location", "Person", "Organization", "HistoricalEvent" ]
        };

        function isShared(schemaName) {
            return (_.contains($rootScope.schemaMap.shared, schemaName))
        }

        function editPathFromHeader(header) {
            if (isShared(header.SchemaName)) {
                return '/shared/' + header.SchemaName + '/' + header.Identifier + '/edit';
            } else {
                return '/primary/' + header.SchemaName + '/' + header.GroupIdentifier + '/' + header.Identifier + '/edit';
            }
        }

        $rootScope.groupIdentifierForSave = function(schemaName, groupIdentifier) {
            if (isShared(schemaName)) {
                if (groupIdentifier != 'OSCR') {
                    throw "Cannot talk ab"
                }
                return undefined;
            }
            else {
                return groupIdentifier;
            }
        };

        $rootScope.defaultDocumentState = function(schemaName) {
            if (isShared(schemaName)) {
                return 'public';
            }
            else {
                return 'private'
            }
        };

        $rootScope.newDocument = function (schema) {
            if (isShared(schema)) {
                $scope.choosePath('/shared/' + schema + '/create');
            } else {
                $scope.choosePath('/primary/' + schema + '/' + $rootScope.user.groupIdentifier + '/create');
            }
        };

        // APPLICATION NAVIGATION ================================================================

        function buildMainMenu(user) {
            $scope.mainMenu = [
                {name: "Dashboard", path: "/dashboard", icon: 'icon-home', active: false},
                {name: "MediaUpload", path: "/media", icon: 'icon-upload', active: false}
            ];
            if (user.god) {
                _.each($rootScope.schemaMap.shared, function(sharedSchema) {
                    $scope.mainMenu.push({
                        name: sharedSchema,
                        path: "/shared/" + sharedSchema,
                        icon: 'icon-th-list',
                        active: false,
                        type: 'shared'
                    });
                });
            }
            _.each($rootScope.schemaMap.primary, function(primarySchema) {
                $scope.mainMenu.push({
                    name: primarySchema,
                    path: "/primary/" + primarySchema + "/" + user.groupIdentifier,
                    icon: 'icon-th-list',
                    active: false,
                    type: 'primary'
                });
            });
            _.forEach($scope.mainMenu, function (link) {
                link.active = ($location.path().indexOf(link.path) >= 0);
                if (link.active) anyActive = true;
            });
            if (!anyActive) {
                $scope.mainMenu[0].active = true;
            }
        }

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
                        buildMainMenu(user);
                    });
                });
            }
        });

        var anyActive = false;
        $scope.recent = [];

        $scope.addToRecentMenu = function(header) {
            // make all inactive
            _.each($scope.mainMenu.concat($scope.recent), function (entry) {
                entry.active = false;
            });
            var recentEntry = _.find($scope.recent, function(entry) {
                return header.Identifier == entry.header.Identifier;
            });
            if (!recentEntry) {
                recentEntry = {
                    name: header.Title,
                    path: editPathFromHeader(header),
                    icon: 'icon-th-home',
                    header: header,
                    recent: true // todo: instead detect if there is a header
                };
                $scope.recent.push(recentEntry);
                if ($scope.recent.length > 10) {
                    $scope.recent.shift();
                }
            }
            // activate the one we just
            recentEntry.active = true;
        };

        $scope.choosePath = function (path) {
            var header = undefined;
            if (_.isObject(path)) { // they may have given us a header to define the path
                header = path;
                path = editPathFromHeader(header);
            }
            $location.path(path);
            $cookieStore.put('oscr-path', path);
        };

        $rootScope.checkLoggedIn = function() {
            if ($location.path() != '/login' && !$rootScope.user) {
                $location.path('/login');
            }
        };

        $scope.sidebarShowing = function() {
            return $location.path() !== '/login';
        };

        $scope.getInclude = function () {
            if ($routeParams.identifier && $location.path().match(/\/edit/) ) {
                return "views/document-edit-legend.html";
            }
            return "";
        };

        // properFile name extension for multi-media thumbs
        $rootScope.getProperThumbExtension = function (name){
            var nameProper= name;
            if (name.match(/(.mp4|.MP4|.mpeg|.MPEG|.mov|.MOV|.pdf)/)) {
                nameProper = name.replace(/(.mp4|.MP4|.mpeg|.MPEG|.mov|.MOV|.pdf)/g, ".jpg");
            }
            return nameProper;
        };

        $rootScope.isImage = function(mime) {
            if(mime && mime.indexOf('image') >= 0){
                return true;
            }
        };

        $rootScope.isVideo = function (mime) {
            if (mime && mime.indexOf('video') >= 0){
                return true;
            }
        };

        $rootScope.isPdf = function (mime) {
            if (mime && mime.indexOf('pdf') >= 0){
                return true;
            }
        };

        // == this is from the former login.js

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
                        if (membership.Role === 'Viewer') {
                            $rootScope.user.viewer = true;
                        }
                    });
                }
            }
            else {
                delete $rootScope.user;
            }
            if(user && user.god === true) {
                $('body').addClass('admin');
            }
        }

        $rootScope.login = function (username, password) {
            $scope.loginFailed = false;
            if (username && username.length) {
                Person.authenticate(username, password, function (user) {
                    setUser(user);
                    if (user) {
                        $scope.choosePath('/dashboard');
                    }
                    else {
                        $rootScope.loginFailed = true;
                        $rootScope.password = '';
                        $scope.choosePath('/login');
                    }
                });
            }
            else {
                alert('login, but username is empty!');
                $scope.choosePath('/login');
            }
        };

        $rootScope.refreshUser = function () {
            if ($rootScope.user) {
                Person.getUser($rootScope.user.Identifier, function (user) {
                    setUser(user);
                });
            }
        };

        $rootScope.getGroupName = function(groupIdentifier) {
            var deferred = $q.defer();
            if (groupIdentifier) {
                Person.getGroup(groupIdentifier, function (group) {
                    deferred.resolve(group.Group.Name);
                });
            }
            else {
                deferred.resolve('?');
            }
            return deferred.promise;
        };

        $rootScope.logout = function () {
            if ($rootScope.config.showTranslationEditor) return;
            $cookieStore.remove('user');
            delete $rootScope.user;
            $('body').removeClass('admin');
            setUser(null);
            $scope.choosePath('/');
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

        $scope.xmlArray = function(node) {
            return xmlArray(node);
        };
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
