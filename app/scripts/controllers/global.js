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
    function ($rootScope, $cookieStore, $timeout, $scope, $location, $routeParams, Person, I18N) {

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

        $rootScope.refreshSchemas = function() {
            Person.refreshSchemas(function (result) {
                alert('refreshed schemas');
            })
        };

        $rootScope.schemaMap =  {
            primary: [ "Photo", "Film", "Memoriam", "Publication" ],
            shared: [ "Location", "Person", "Organization", "HistoricalEvent" ]
        };

        // GLOBAL NEW DOCUMENT ====================================================================
        // TODO: similar function in document-list.js - can we reuse this one?
        $rootScope.globalNewPrimaryDocument = function (schema) {
            $scope.choosePath('/document/' + schema + '/' + $rootScope.user.groupIdentifier + '/edit/create');
        };

        $rootScope.globalNewSharedDocument = function (schema) {
            $scope.choosePath('/document/' + schema + '/edit/create');
        };

        // APPLICATION NAVIGATION ================================================================

        $scope.mainMenu = [
            {name: "Dashboard", path: "/dashboard", icon: 'icon-home', active: false},
            {name: "MediaUpload", path: "/media", icon: 'icon-upload', active: false}
        ];

        _.each($rootScope.schemaMap.shared, function(sharedSchema) {
            $scope.mainMenu.push({
                name: sharedSchema,
                path: "/document/" + sharedSchema,
                icon: 'icon-file',
                active: false,
                type: 'shared'
            });
        });

        $rootScope.$watch('user', function (user, before) {
            if (!user) return;
            _.each($rootScope.schemaMap.primary, function(primarySchema) {
                $scope.mainMenu.push({
                    name: primarySchema,
                    path: "/document/" + primarySchema + "/" + $rootScope.user.groupIdentifier, // todo: will this arrive too late??
                    icon: 'icon-file',
                    active: false,
                    type: 'primary'
                });
            });
        });

        var anyActive = false;

        _.forEach($scope.mainMenu, function (link) {
            link.active = ($location.path().indexOf(link.path) >= 0);
            if (link.active) anyActive = true;
        });
        if (!anyActive) {
            $scope.mainMenu[0].active = true;
        }

        $scope.choosePath = function (path, header) {
//            console.log('PATH '+path);
            var activeItem = false, freshLabel = {};
            _.forEach($scope.mainMenu.concat($scope.recent), function (link) {
                link.active = (link.path == path);
                if (link.active) activeItem = true;
            });
            if (!activeItem && path.indexOf('/document') == 0 && path.indexOf('create') < 0) {
                freshLabel = {
                    path: path,
                    icon: 'icon-th-home',
                    active: true,
                    recent: true
                };
                if (header) {
                    freshLabel.name = header.Title;
                }
                else {
                    freshLabel.name = path.substring(path.lastIndexOf("/") + 1, path.length);
                }
                $scope.recent.push(freshLabel);
                if ($scope.recent.length > 10) {
                    $scope.recent.shift();
                }
            }
            $location.path(path);
            $cookieStore.put('oscr-path', path);
        };

        $rootScope.checkLoggedIn = function() {
            if ($location.path() != '/login' && !$rootScope.user) {
                $location.path('/login');
            }
        };

        $scope.recent = [];

        $scope.useHeaderInMenu = function(header) {
            _.each($scope.recent, function(recent) {
                if (header.Identifier == recent.name) {
                    recent.name = header.Title;
                }
            });
        };

        $scope.sidebarShowing = function() {
            return $location.path() !== '/login';
        };

        $scope.getInclude = function () {
            if ($routeParams.identifier && $location.path().match(/\/edit\//) ) {
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
