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

/*
 * GlobalController:
 * Wraps the entire application and contains $rootScope elements that need to be available to multiple controllers and view
 * TODO: rely less on $rootScope and create resource factories that contain variables and functions that need be shared between different controllers.
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

Schemaleon.controller(
    'GlobalController',
    function ($rootScope, $scope, $cookieStore, $timeout, $q, $location, $window, $document, $routeParams, $filter, Document, Person, I18N, Statistics, $modal, $anchorScroll) {

        // CONFIGURATION SETTINGS ================================================================
        $rootScope.config = {
            interfaceLanguages: [
                {name: 'English', code: 'en'},
                {name: 'Nederlands', code: 'nl'},
                {name: 'Svenska', code: 'sv'}
            ],
            interfaceLanguage: 'en',
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
         * returns the group identifier to which the currently authorized user belongs
         * @return {String} $rootScope.user.Membership.GroupIdentifier
         */
        $rootScope.userGroupIdentifier = function() {
            if (!($rootScope.user && $rootScope.user.Membership)) return 'unknown';
            return $rootScope.user.Membership.GroupIdentifier;
        };

        /**
         * Create a new document
         * @param {String} schema
         * @return navigates to the new document page with chosen schema
         */
        $rootScope.newDocument = function (schema) {
            if (isSchemaShared(schema, $rootScope)) {
                $scope.choosePath('/shared/' + schema + '/create');
            } else {
                $scope.choosePath('/primary/' + schema + '/' + $rootScope.userGroupIdentifier() + '/create');
            }
        };

        $rootScope.documentList = function (schema) {
            if (isSchemaShared(schema, $rootScope)) {
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
                    {name: "Home", path: "/home", icon: 'glyphicon-home', active: false},
                    {name: "Dashboard", path: "/dashboard", icon: 'glyphicon-cog', active: false}
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

                        if (user.Membership.GroupIdentifier == 'Schemaleon') {
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

                        _.forEach(_.union($scope.mainMenuBase, $scope.mainMenuPrimary, $scope.mainMenuShared, $scope.recent), function (link) {
                            if (link) {
                                if (!link.path) {
                                    link.path = editPathFromHeader(link.header, $rootScope.schemaMap);
                                }
                                link.active = ($location.path().indexOf(link.path) != -1);
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
                        if (user.Membership.GroupIdentifier == 'Schemaleon') {
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
                    icon: 'icon-th-home',
                    header: header
                };
                $scope.recent.push(recentEntry);
                if ($scope.recent.length > 10) {
                    $scope.recent.shift();
                }
            }
            buildMainMenu()
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
        $rootScope.choosePath = function (path, viewOnly) {
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
            if (_.isObject(path) && $rootScope.schemaMap) { // they may have given us a header to define the path
                header = path;
                if(!viewOnly){
                    path = editPathFromHeader(header, $rootScope.schemaMap);
                }
                else {
                    path = viewPathFromHeader(header, $rootScope.schemaMap);
                }
            }
            $location.path(path);
            $cookieStore.put('schemaleon-path', path);
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
                            $cookieStore.put('schemaleon-user-identifier', user.Identifier);
                        }
                        $scope.choosePath('/home');
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
            $cookieStore.remove('schemaleon-user-identifier');
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
            options = options || {};
            var hash = options.hash || undefined,
                element = options.element || undefined,
                direction = options.direction || 'up';
            // navigate to hash
            if(hash) {
                var old = $location.hash();
                $location.hash(hash);
                $anchorScroll();
                $location.hash(old);//reset to old location in order to maintain routing logic (no hash in the url)
            }
            // scroll the provided dom element if it exists
            if(element && $(options.element).length) {
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
        };

        // for development only during livereload
        if ($location.host() == 'localhost') {
            var userIdentifier = $cookieStore.get('schemaleon-user-identifier');
            if (userIdentifier) {
                Person.getUser(userIdentifier, function(user) {
                    $rootScope.user = user;
                    var path = $cookieStore.get('schemaleon-path');
                    if (path) {
                        $timeout(
                            function () {
                                $scope.choosePath(path);
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

        $scope.showUserConsole = true;
        $scope.toggleUserConsole = function () {
            $scope.showUserConsole = !$scope.showUserConsole;
        }
    }
);
