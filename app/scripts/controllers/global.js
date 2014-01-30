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
    function ($rootScope, $cookieStore, $timeout, $scope, $q, $location, $anchorScroll, $routeParams, Person, I18N, Statistics) {

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

        $scope.recent = [];

        $rootScope.schemaMap =  {
            primary: [ "Photo", "Film", "Memoriam", "Publication" ],
            shared: [ "Location", "Person", "Organization", "HistoricalEvent" ]
        };

        $rootScope.toggleTranslationEditor = function () {
            $rootScope.config.showTranslationEditor = !$rootScope.config.showTranslationEditor;
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

        function viewPathFromHeader(header) {
            if (isShared(header.SchemaName)) {
                return '/shared/' + header.SchemaName + '/' + header.Identifier + '/view';
            } else {
                return '/primary/' + header.SchemaName + '/' + header.GroupIdentifier + '/' + header.Identifier + '/view';
            }
        }

        $rootScope.userGroupIdentifier = function() {
            if (!($rootScope.user && $rootScope.user.Membership)) return 'unknown';
            return $rootScope.user.Membership.GroupIdentifier;
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
                $scope.choosePath('/primary/' + schema + '/' + $rootScope.userGroupIdentifier() + '/create');
            }
        };

        $rootScope.documentList = function (schema) {
            if (isShared(schema)) {
                $scope.choosePath('/shared/' + schema);
            } else {
                $scope.choosePath('/primary/' + schema + '/' + $rootScope.userGroupIdentifier());
            }
        };

        // APPLICATION NAVIGATION ================================================================


        function buildMainMenu() {

            if (!$rootScope.user) return;

            $scope.mainMenuBase = [
                {name: "Public", path: "/public", icon: 'icon-road', active: false},
                {name: "Dashboard", path: "/dashboard", icon: 'icon-cog', active: false},
                {name: "MediaUpload", path: "/media", icon: 'icon-upload', active: false}
            ];

            var user = $rootScope.user;
            if (user.Membership) {

                Statistics.getGlobalStatistics($rootScope.userGroupIdentifier(), function (statistics) {
                    $scope.statistics = statistics;

                    function getCountForSchema(statisticList, schemaName) {
                        var found = _.find($scope.statistics[statisticList].Schema, function (entry) {
                            return entry.Name == schemaName;
                        });
                        if (!found) {
                            console.log("no stat found for", schemaName);
                        }
                        return  found.Count;
                    }

                    if (user.Membership.GroupIdentifier == 'OSCR') {
                        $scope.mainMenuShared = _.map($rootScope.schemaMap.shared, function (sharedSchema) {
                            return {
                                name: sharedSchema,
                                path: "/shared/" + sharedSchema,
                                count: getCountForSchema('Shared', sharedSchema),
                                icon: 'icon-th-list',
                                active: false
                            };
                        });
                    }

                    $scope.mainMenuPrimary = _.map($rootScope.schemaMap.primary, function(primarySchema) {
                        return {
                            name: primarySchema,
                            path: "/primary/" + primarySchema + "/" + user.Membership.GroupIdentifier,
                            count: getCountForSchema('Primary', primarySchema),
                            icon: 'icon-th-list',
                            active: false
                        };
                    });

                    var anyActive = false;
                    _.forEach(_.union($scope.mainMenuBase, $scope.mainMenuPrimary, $scope.mainMenuShared, $scope.recent), function (link) {
//                console.log('locapath', $location.path());
//                console.log('linkpath', link.path);
//                console.log($location.path().indexOf(link.path));
                        link.active = ($location.path().indexOf(link.path) != -1);
                        if (link.active) anyActive = true;
                    });
//            if (!anyActive) {
//                $scope.mainMenuBase[0].active = true;
//            }
                });
            }
        }

        $rootScope.$watch('user', function (user, before) {
            console.log("user changed", user);
            if (!user) return;
            if (user.Membership) {
                switch (user.Membership.Role) {
                    case 'Administrator':
                        user.editor = true;
                        if (user.Membership.GroupIdentifier == 'OSCR') {
                            user.god = true;
                            $('body').addClass('admin');
                        }
                        break;
                    case 'Member':
                        user.editor = true;
                        break;
                    case 'Viewer':
                        user.viewer = true;
                        break;
                }
                Person.getGroup(user.Membership.GroupIdentifier, function (group) {
                    user.group = group.Group;
                    user.groupLabel = user.group.Name + ' (' + user.Membership.Role + ')';
                });
            }
        });

        $scope.addToRecentMenu = function(header) {
            var recentEntry = _.find($scope.recent, function(entry) {
                return header.Identifier == entry.header.Identifier;
            });
            if (!recentEntry) {
                recentEntry = {
                    name: header.SummaryFields.Title,
                    path: editPathFromHeader(header),
                    icon: 'icon-th-home',
                    header: header
                };
                $scope.recent.push(recentEntry);
                if ($scope.recent.length > 10) {
                    $scope.recent.shift();
                }
            }
            // activate the one we just
            buildMainMenu();
            recentEntry.active = true;
        };

        $rootScope.choosePath = function (path, viewOnly) {
            console.log(path);
            var header = undefined;
            if (_.isObject(path)) { // they may have given us a header to define the path
                header = path;
                if(!viewOnly){
                    path = editPathFromHeader(header);
                }
                else {
                    path = viewPathFromHeader(header);
                }
            }
            $location.path(path);
            $cookieStore.put('oscr-path', path);
            buildMainMenu();
        };

        $rootScope.chooseUserPath = function (id) {
            $rootScope.choosePath('/people/user/'+id);
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
            return (mime && mime.indexOf('image') >= 0);
        };

        $rootScope.isVideo = function (mime) {
            return (mime && mime.indexOf('video') >= 0);
        };

        $rootScope.isPdf = function (mime) {
            return (mime && mime.indexOf('pdf') >= 0);
        };

        $rootScope.login = function (username, password) {
            $scope.loginFailed = false;
            delete $rootScope.user;
            if (username && username.length) {
                Person.authenticate(username, password, function (user) {
                    if (user) {
                        $rootScope.user = user;
                        if ($location.host() == 'localhost') {
                            console.log('setting user identifier', user.Identifier);
                            $cookieStore.put('oscr-user-identifier', user.Identifier);
                        }
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
            $cookieStore.remove('oscr-user-identifier');
            $('body').removeClass('admin');
            delete $rootScope.user;
            $scope.choosePath('/login');
        };

        $rootScope.scrollToTop = function () {
            var height =  $('body').height();
            $('html,body').stop().animate({
                scrollLeft: '+=' + 0,
                scrollTop: '+=' + -height
            })
        };

        if ($location.host() == 'localhost') {
            var userIdentifier = $cookieStore.get('oscr-user-identifier');
            console.log('getting userIdentifier ', userIdentifier);
            if (userIdentifier) {
                Person.getUser(userIdentifier, function(user) {
                    $rootScope.user = user;
                    var oscrPath = $cookieStore.get('oscr-path');
                    if (oscrPath) {
                        $timeout(
                            function () {
                                $scope.choosePath(oscrPath);
                            },
                            300
                        );
                    }
                })
            }
        }

        $scope.xmlArray = function(node) {
            return xmlArray(node);
        };

        // layout functions
        $rootScope.equalHeight = function equalHeight(elements) {
            if(!elements) return;
            tallest = 0;
            elements.each(function() {
                thisHeight = $(this).height();
                if(thisHeight > tallest) {
                    tallest = thisHeight;
                }
            });
            elements.height(tallest);
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
