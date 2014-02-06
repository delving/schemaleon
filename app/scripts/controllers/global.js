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
    function ($rootScope, $scope, $cookieStore, $timeout, $q, $location, $anchorScroll, $routeParams, $filter, Person, I18N, Statistics) {

        // CONFIGURATION SETTINGS ================================================================

        $rootScope.config = {
            interfaceLanguages: [
                {name: 'English', code: 'en'},
                {name: 'Nederlands', code: 'nl'},
                {name: 'Frysk', code: 'fy'},
                {name: 'Norsk', code: 'no'},
                {name: 'Svenska', code: 'sv'}
            ],
            interfaceLanguage: 'nl',
            showTranslationEditor: false
        };

        $rootScope.disableChoosePath = false;

        $rootScope.globalError = null;
        var globalErrorErasePromise;

        $rootScope.setGlobalError = function(error) {
            if (globalErrorErasePromise) {
                $timeout.cancel(globalErrorErasePromise);
            }
            $rootScope.globalError = error;
            globalErrorErasePromise  = $timeout(
                function() {
                    $rootScope.globalError = null;
                    globalErrorErasePromise = null;
                },
                6000
            );
        };

        $scope.recent = [];

        $rootScope.schemaMap =  {
            primary: [ "Photo", "Film", "Memoriam", "Publication", "Object", "GemondeArchief" ],
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
                {name: "Dashboard", path: "/dashboard", icon: 'icon-cog', active: false}
            ];

            var user = $rootScope.user;
            if (user.Membership) {

                if (_.indexOf(['Administrator', 'Member'], user.Membership.Role) >= 0) {
                    $scope.mainMenuBase.push({name: "MediaUpload", path: "/media", icon: 'icon-upload', active: false});
                }

                Statistics.getGlobalStatistics($rootScope.userGroupIdentifier(), function (statistics) {
                    $scope.statistics = statistics;

                    function getCountForSchema(statisticList, schemaName) {
                        var found = _.find($scope.statistics[statisticList].Schema, function (entry) {
                            return entry.Name == schemaName;
                        });
                        if (!found) {
                            console.log("no stat found for", schemaName);
                            return 0;
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
                        if(link){
                            link.active = ($location.path().indexOf(link.path) != -1);
                            if (link.active) anyActive = true;
                        }
                    });
                });
            }
            else {
                Statistics.getGlobalStatistics(null, function (statistics) {
                    $scope.statistics = statistics;
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
                    user.group = group;
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
            if($rootScope.disableChoosePath) {
                $rootScope.setGlobalError('Please save your document first');
                // todo: modal to save or continue;
                return;
            }
            //todo: catch a dirty document
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
            if ($location.path().match(/.*\/(edit|create)/) ) {
                return "views/document-edit-legend.html";
            }
            return "";
        };

        $rootScope.getExtensionFromMimeType = function(mimeType) {
            var extension;
            switch (mimeType) {
                case 'image/jpeg':
                case 'image/jpg': // todo: from Sjoerd's import
                    extension = '.jpg';
                    break;
                case 'image/png':
                    extension = '.png';
                    break;
                case 'image/gif':
                    extension = '.gif';
                    break;
                case 'video/mp4':
                    extension = '.mp4';
                    break;
                case 'video/quicktime':
                    extension = '.mov';
                    break;
                case 'application/pdf':
                    extension = '.pdf';
                    break;
            }
            return extension;
        };

        var fileSplitRegExp = new RegExp('(.*)([.][^.]*)');

        function getExtension(fileName) {
            var fileNameMatch = fileSplitRegExp.exec(fileName);
            if (!fileNameMatch) {
                console.error('file name did not have the right form to extract extension '+fileName);
                return '.jpg';
            }
            else {
                return fileNameMatch[2];
            }
        }

        $rootScope.getMimeTypeFromFileName = function(fileName) {
            var mimeType;
            switch(getExtension(fileName.toLowerCase())) {
                case '.jpg':
                    mimeType = 'image/jpeg';
                    break;
                case '.png':
                    mimeType = 'image/png';
                    break;
                case '.gif':
                    mimeType = 'image/gif';
                    break;
                case '.mp4':
                    mimeType = 'video/mp4';
                    break;
                case '.mov':
                    mimeType = 'video/quicktime';
                    break;
                case '.pdf':
                    mimeType = 'application/pdf';
                    break;
                default:
                    console.error('No mime type for extension '+getExtension(fileName));
                    break;
            }
            return mimeType;
        };

        $rootScope.thumbnailExtension = '.jpg';

        $rootScope.thumbnailMimeType = 'image/jpeg';

        // properFile name extension for multi-media thumbs
        // todo: this should no longer be necessary
        $rootScope.getProperThumbExtension = function (name){
            console.log('getProperThumb', name);
            var nameProper= name;
            if (name.match(/(.mp4|.MP4|.mpeg|.MPEG|.mov|.MOV|.pdf)/)) {
                nameProper = name.replace(/(.mp4|.MP4|.mpeg|.MPEG|.mov|.MOV|.pdf)/g, ".jpg");
            }
            return nameProper;
        };

        $rootScope.extractMimeType = function(source) {
            var mime = '';
            if (source) {
                if (source.value) {
                    mime = source.value.MimeType;
                }
                else if (source.Body && source.Body.MediaMetadata) {
                    mime = source.Body.MediaMetadata.MimeType;
                }
                else if (_.isString(source)) {
                    mime = source;
                }
            }
//            console.log('extractedMimeType=' + mime, source);
            return mime;
        };

        $rootScope.isImage = function(source) {
            var mime = $rootScope.extractMimeType(source);
            return (mime && mime.indexOf('image') >= 0);
        };

        $rootScope.isVideo = function (source) {
            var mime = $rootScope.extractMimeType(source);
            return (mime && mime.indexOf('video') >= 0);
        };

        $rootScope.isPdf = function (source) {
            var mime = $rootScope.extractMimeType(source);
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
                        $scope.loginFailed = true;
                        $scope.password = '';
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
                    deferred.resolve(group.Name);
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
        // todo: replace this with https://github.com/akoenig/angular-deckgrid
        $rootScope.equalHeight = function (elements) {
            if(!elements) return;
            var tallest = 0;
            elements.each(function() {
                var thisHeight = $(this).height();
                if(thisHeight > tallest) {
                    tallest = thisHeight;
                }
            });
            elements.each(function(){
                $(this).css('height',tallest);
            });
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

// filter either an element or an identifier to pick up thumbmnail
OSCR.filter('mediaThumbnail',
    function () {
        return function (source) {
            if (source.value && source.config.media) {
                return '/media/thumbnail/' + source.value.Identifier;
            }
            else if (_.isString(source)) {
                return '/media/thumbnail/' + source; // just an identifier
            }
            else {
                return '';
            }
        };
    }
);

// filter either an element or an identifier to pick up a media file
OSCR.filter('mediaFile',
    function () {
        return function (source) {
            if (source.value && source.config.media) {
                return '/media/file/' + source.value.Identifier;
            }
            else if (_.isString(source)) {
                return '/media/file/' + source;
            }
            else {
                return '';
            }
        };
    }
);

// filter either an element or an identifier to pick up a media file
OSCR.filter('mediaMimeType',
    function () {
        return function (source) {
            if (!source) return '';
            if (source.value) {
                return source.value.MimeType;
            }
            else if (source.Body) {
                return source.Body.MediaMetadata.MimeType;
            }
            else if (_.isString(source)) {
                return source;
            }
            else {
                return '';
            }
        };
    }
);

// filter either an element or an identifier to pick up a media file
OSCR.filter('mediaFileName',
    function () {
        return function (source) {
            if (!source) return '';
            if (source.value) {
                return source.value.FileName;
            }
            else if (source.Body) {
                return source.Body.MediaMetadata.FileName;
            }
            else if (_.isString(source)) {
                return source;
            }
            else {
                return '';
            }
        };
    }
);

// not used, it seems
//OSCR.filter('mediaLabel',
//    function () {
//        return function (element) {
//            if (_.isString(element.value)) {
//                return element.value;
//            }
//            else if (element.value) {
//                return element.value.Label;
//            }
//            else {
//                return '';
//            }
//        };
//    }
//);

OSCR.filter('elementDisplay',
    function () {
        return function (element) {
            if (!element.value) {
                return 'empty';
            }
            else if (element.config.vocabulary) {
                return element.value.Label; // todo
            }
            else if (element.config.media) {
                return element.value.Identifier;
            }
            else {
                return element.value;
            }
        };
    }
);

