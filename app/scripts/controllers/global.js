// ================================================================================
// Copyright 2014 Delving BV, Rotterdam, Netherands
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.
// ================================================================================

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

/**
 * GlobalController:
 * Wraps the entire application and contains $rootScope elements that need to be available to multiple controllers and view
 * TODO: rely less on $rootScope and create resource factories that contain variables and functions that need be shared between different controllers.
 */
OSCR.controller(
    'GlobalController',
    function ($rootScope, $scope, $cookieStore, $timeout, $q, $location, $window, $document, $routeParams, $filter, Document, Person, I18N, Statistics, $modal, $anchorScroll) {

        // CONFIGURATION SETTINGS ================================================================
        $rootScope.config = {
            interfaceLanguages: [
                {name: 'English', code: 'en'},
                {name: 'Nederlands', code: 'nl'},
                {name: 'Svenska', code: 'sv'}
            ],
            interfaceLanguage: 'nl',
            showTranslationEditor: false
        };

        // set to true when a document is dirty and triggers modal save dialog when clicking choosePath() away from the document
        $rootScope.disableChoosePath = false;
        /**
         * Sets disableChoosePath and passes functions
         * @param {Boolean} dirty
         * @param {Function} saveDocument
         * @param {Function} revertDocument
         */
        $rootScope.setDocumentDirty = function(dirty, saveDocument, revertDocument) {
            $rootScope.disableChoosePath = dirty;
            $rootScope.saveDocument = saveDocument;
            $rootScope.revertDocument = revertDocument;
        };

        // globalError message
        $rootScope.globalError = null;
        var globalErrorErasePromise;
        /**
         * Sets globalError with error value
         * @param {String} error
         */
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
                7000
            );
        };

        /**
         * toggles the value of $rootScope.config.showTranslationEditor which is used to disable various functions
         * to kill the onclick functionality during translation
         * @return {Boolean} $rootScope.config.showTranslationEditor
         */
        $rootScope.toggleTranslationEditor = function () {
            $rootScope.config.showTranslationEditor = !$rootScope.config.showTranslationEditor;
        };

        /**
         * Checks to see if a schema is shared
         * @param {String} schemaName
         * @return {Boolean}
         */
        $rootScope.isShared = function (schemaName) {
            // this function will throw errors in development mode because of livereload
            return (_.contains($rootScope.schemaMap.shared, schemaName))
        }

        /**
         * Returns a path to edit the document. Shared docs don't have a group Identifier, primary document do.
         * @param {String} schemaName
         * @return {Boolean}
         */
        function editPathFromHeader(header) {
            if ($rootScope.isShared(header.SchemaName)) {
                return '/shared/' + header.SchemaName + '/' + header.Identifier + '/edit';
            } else {
                return '/primary/' + header.SchemaName + '/' + header.GroupIdentifier + '/' + header.Identifier + '/edit';
            }
        }

        /**
         * Returns a path to view the document. Shared docs don't have a group Identifier, primary document do.
         * @param {String} schemaName
         * @return {Boolean}
         */
        function viewPathFromHeader(header) {
            if ($rootScope.isShared(header.SchemaName)) {
                return '/shared/' + header.SchemaName + '/' + header.Identifier + '/view';
            } else {
                return '/primary/' + header.SchemaName + '/' + header.GroupIdentifier + '/' + header.Identifier + '/view';
            }
        }

        /**
         * returns the group identifier to which the currently authorized user belongs
         * @return {String} $rootScope.user.Membership.GroupIdentifier
         */
        $rootScope.userGroupIdentifier = function() {
            if (!($rootScope.user && $rootScope.user.Membership)) return 'unknown';
            return $rootScope.user.Membership.GroupIdentifier;
        };

        /**
         * returns the default document state of a particular schema
         * @return {String} public | private
         */
        $rootScope.defaultDocumentState = function(schemaName) {
            if ($rootScope.isShared(schemaName)) {
                return 'public';
            }
            else {
                return 'private'
            }
        };

        /**
         * Create a new document
         * @param {String} schema
         * @return navigates to the new document page with chosen schema
         */
        $rootScope.newDocument = function (schema) {
            if ($rootScope.isShared(schema)) {
                $scope.choosePath('/shared/' + schema + '/create');
            } else {
                $scope.choosePath('/primary/' + schema + '/' + $rootScope.userGroupIdentifier() + '/create');
            }
        };

        $rootScope.documentList = function (schema) {
            if ($rootScope.isShared(schema)) {
                $scope.choosePath('/shared/' + schema);
            } else {
                $scope.choosePath('/primary/' + schema + '/' + $rootScope.userGroupIdentifier());
            }
        };

        // APPLICATION NAVIGATION ================================================================

        /**
         * Creates the main navigation visible on the left hand side
         * Makes use of the Document service to retrieve schemas
         * Makes use of the Statistics service to retrieve document counts per schema
         */
        function buildMainMenu() {

            if (!$rootScope.user) return;

            Document.fetchSchemaMap(function (schemaMap) {
                $rootScope.schemaMap = schemaMap;
//                console.log('schema map received', schemaMap);
                $scope.mainMenuBase = [
                    {name: "Public", path: "/public", icon: 'glyphicon-road', active: false},
                    {name: "Community", path: "/community", icon: 'glyphicon-cog', active: false}
                ];

                var user = $rootScope.user;
                if (user.Membership) {

                    if (_.indexOf(['Administrator', 'Member'], user.Membership.Role) >= 0) {
                        $scope.mainMenuBase.push({name: "MediaUpload", path: "/media", icon: 'glyphicon-upload', active: false});
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
                                    icon: 'glyphicon-th-list',
                                    active: false
                                };
                            });
                        }

                        $scope.mainMenuPrimary = _.map($rootScope.schemaMap.primary, function(primarySchema) {
                            return {
                                name: primarySchema,
                                path: "/primary/" + primarySchema + "/" + user.Membership.GroupIdentifier,
                                count: getCountForSchema('Primary', primarySchema),
                                icon: 'glyphicon-th-list',
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
            });
        }

        $rootScope.$watch('user', function (user, before) {
//            console.log("user changed", user);
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


        // recently opened Documents
        $scope.recent = [];
        /**
         * adds a document to the recent list - visible at bottom of the left main menu - and rebuilds the main menu to set the 'active' classes.
         * @param {Object} header
         */
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
            // activate the one we just added
            buildMainMenu();
            recentEntry.active = true;
        };

        /**
         * gives visual cue if another user is working on the same document (document must be dirty to trigger)
         * TODO: create a locking mechanism for the document instead of just a visual indication
         * @param {Object} documentLease
         */
        $rootScope.showDocumentsLeased = function(documentLeases) {
//            console.log(documentLeases);
            if (!$scope.recent) return;
            _.each($scope.recent, function(entry) {
                entry.leased = false;
                _.each(documentLeases, function(lease) {
                    if (lease.user == $rootScope.user.Identifier) return;
                    if (!entry.leased) entry.leased = (entry.header.Identifier == lease.document) ? lease.user : null;
                });
            });
        };

        /**
         * navigation function: contains trigger for document save modal dialog
         * @param {String||Object} path - path to the view
         * @param {Boolean} viewOnly - when true (as in links from public) will create url from header to view instead of edit.
         */
        $rootScope.choosePath = function (path,viewOnly) {
            if($rootScope.config.showTranslationEditor) return;
            if($rootScope.disableChoosePath) {
                $rootScope.setGlobalError('Please save your document first');
                var modalInstance = $modal.open({
                    templateUrl: 'confirm-save-document.html',
                    controller: function($scope, $modalInstance) {
                        $scope.ok = function () {
                            $rootScope.saveDocument();
                            $rootScope.disableChoosePath = false;
                            $rootScope.globalError = null;
                            $modalInstance.close();
                        };
                        $scope.cancel = function () {
                            $rootScope.revertDocument();
                            $rootScope.disableChoosePath = false;
                            $rootScope.globalError = null;
                            $modalInstance.dismiss();
                            $rootScope.choosePath(path, viewOnly);
                        };
                    }
                });
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

        /**
         * Navigates to user page
         * @param {String} id
         * @return {Function call} choosePath()
         */
        $rootScope.chooseUserPath = function (id) {
            $rootScope.choosePath('/people/user/'+id);
        };

        /**
         * Redirect to login page if not authorized
         */
        $rootScope.checkLoggedIn = function() {
            if ($location.path() != '/login' && !$rootScope.user) {
                $location.path('/login');
            }
        };

        /**
         * Determins when we want to show the sidebar navigation
         * @return {Boolean}
         */
        $scope.sidebarShowing = function() {
            return $location.path() !== '/login';
        };

        /**
         * Depending on where we are in the app we may want to include different views as includes
         * @return {String} (view location)
         */
        $scope.getInclude = function () {
            if ($location.path().match(/.*\/(edit|create)/) ) {
                return "views/document-edit-legend.html";
            }
            return "";
        };

        /**
         * return a file extension based on mime type
         * @param {String} mimeType
         * @return {String} extension
         */
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

        /**
         * gets file extestion from filename
         * @param {String} fileName
         * @return {String} extension
         */
        function getExtension(fileName) {
            var fileSplitRegExp = new RegExp('(.*)([.][^.]*)');
            var fileNameMatch = fileSplitRegExp.exec(fileName);
            var extension = '';
            if (!fileNameMatch) {
                console.error('file name did not have the right form to extract extension '+fileName);
                extension = '.jpg';
            }
            else {
                extension = fileNameMatch[2];
            }
            return extension;
        }

        /**
         * gets mime type from file name
         * @param {String} fileName
         * @return {String} mimeType
         */
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

        /**
         * Extracts mime type from different source formats
         * @param {Object} source
         * @return {String} mime
         */
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

        /**
         * Checks to see if passed source is an image
         * @param {Object} source
         * @return {Boolean}
         */
        $rootScope.isImage = function(source) {
            var mime = $rootScope.extractMimeType(source);
            return (mime && mime.indexOf('image') >= 0);
        };

        /**
         * Checks to see if passed source is a video
         * @param {Object} source
         * @return {Boolean}
         */
        $rootScope.isVideo = function (source) {
            var mime = $rootScope.extractMimeType(source);
            return (mime && mime.indexOf('video') >= 0);
        };

        /**
         * Checks to see if passed source is a pdf file
         * @param {Object} source
         * @return {Boolean}
         */
        $rootScope.isPdf = function (source) {
            var mime = $rootScope.extractMimeType(source);
            return (mime && mime.indexOf('pdf') >= 0);
        };

        /**
         * Authenticate a user
         * @param {String} username
         * @param {String} password
         * @return {Boolean}
         */
        $rootScope.login = function (username, password) {
            $scope.loginFailed = false;
            delete $rootScope.user;
            if (username && username.length) {
                Person.authenticate(username, password, function (user) {
                    if (user) {
                        $rootScope.user = user;
                        if ($location.host() == 'localhost') {
//                            console.log('setting user identifier', user.Identifier);
                            $cookieStore.put('oscr-user-identifier', user.Identifier);
                        }
                        $scope.choosePath('/community');
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

        /**
         * Returns a promise with a groupname based on group identifier
         * @param {String} groupIdentifier
         * @return {String} deferred.promise (group.Name)
         */
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

        /**
         * Logout
         */
        $rootScope.logout = function () {
            if ($rootScope.config.showTranslationEditor) return;
            $cookieStore.remove('oscr-user-identifier');
            $('body').removeClass('admin');
            delete $rootScope.user;
            $scope.choosePath('/login');
        };

        /**
         * Scrolls up and down to a named anchor hash, or top/bottom of an element
         * @param {Object} options: hash - named anchor, element - html element (usually a div) with id
         * eg. scrollTo({'hash': 'page-top'})
         * eg. scrollto({'element': '#document-list-container'})
         */
        $rootScope.scrollTo = function (options) {
            var options = options || {},
                hash = options.hash || undefined,
                element = options.element || undefined,
                direction = options.direction || 'up';
            // navigate to hash
            if(hash) {
                var old = $location.hash();
                $location.hash(hash);
                $anchorScroll();
                $location.hash(old);//reset to old location in order to maintain routing logic (no hash in the url)
            }
            // scroll the provided dom element
            if(element) {
                var scrollElement = $(options.element);
                // get the height from the actual content, not the container
                var scrollHeight = scrollElement[0].scrollHeight;
                var distance = '';
                if(!direction || direction == 'up') {
                    distance = -scrollHeight;
                }
                else {
                    distance = scrollHeight;
                }
                scrollElement.stop().animate({
                    scrollLeft: '+=' + 0,
                    scrollTop: '+=' + distance
                });
            }
        }

        // for development only during livereload
        if ($location.host() == 'localhost') {
            var userIdentifier = $cookieStore.get('oscr-user-identifier');
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
        // todo: replace this with https://github.com/akoenig/angular-deckgrid?
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
                $(this).css('height',tallest+10);
            });
        }
    }
);

OSCR.directive('scrollable', function($window, $timeout) {
    return {
        restrict: 'E,A',
        replace: false,
        link: function($scope, $element, $attrs){
            // wrap in timeout because this directive is also called inside the mediaList directive (media.js)
            // and needs to run the $apply cycle to pick up it's offsetHeight attribute to pass into here
            $timeout(function(){
                var offset = $attrs.offset,
                    height = $attrs.fixedHeight;
                $scope.elHeight = null;
                function initialize () {
                    if(!height){
                        $scope.elHeight = $window.innerHeight - offset;
                    }
                    else {
                        $scope.elHeight = height;
                    }
                }
                initialize();
                return angular.element($window).bind('resize', function() {
                    initialize();
                    return $scope.$apply();
                });
            });
        }
    }
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

