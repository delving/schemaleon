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

'use strict';

var OSCR = angular.module('OSCR');

/**
 * Handle internationalization. See also directives.js.
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

OSCR.controller(
    'I18NController',
        function ($rootScope, $scope, $modal, $window, I18N) {

//            var lang = ($window.navigator.userLanguage || $window.navigator.language).substring(0,2);

            $rootScope.allKeysI18N = {};

            $scope.$watch('config.interfaceLanguage', function (newValue, oldValue) {
                I18N.fetchList(newValue);
            });

            $scope.openLabelDialog = function (keyHolder) {
                var modal = $modal.open({
                    controller: function ($scope, $modalInstance, I18N, key) {
                        $scope.key = key;
                        if (I18N.isReady()) {
                            $scope.label = I18N.label(key);
                        }
                        $scope.close = function (label) {
                            $modalInstance.close({ label: label, key: $scope.key });
                        };
                    },
                    dialogFade: true,
                    backdrop: true,
                    fadeBackdrop: true,
                    keyboard: true,
                    resolve: {
                        key: function () {
                            return _.isString(keyHolder) ? keyHolder : keyHolder.name;
                        }
                    },
                    template: '<div class="modal-header"><h3>Label</h3></div>' +
                        '<div class="modal-body">' +
                        '<label class="i18n-heading">Translate &quot;<span>{{ key }}</span>&quot; into language &quot;<span>{{ lang }}</span>&quot;</label>' +
                        '<input autofocus class="form-control" ng-model="label"/>' +
                        '</div>' +
                        '<div class="modal-footer">' +
                        '<button ng-click="close(label)" class="btn btn-primary"><i class="glyphicon glyphicon-ok"></i> Ok</button>' +
                        '</div>'

                });
                modal.result.then(function (labelEntry) {
                    if (labelEntry && labelEntry.label) {
                        I18N.setLabel(labelEntry.key, labelEntry.label);
                    }
                });
            };

            $scope.openTitleDialog = function (element) {
                var modal = $modal.open({
                    controller: function ($scope, $modalInstance, element) {
                        $scope.element = element;
                        $scope.title = element.title;
                        $scope.close = function (result) {
                            $modalInstance.close(result);
                        };
                    },
                    dialogFade: true,
                    backdrop: true,
                    fadeBackdrop: true,
                    keyboard: true,
                    resolve: {
                        element: function () {
                            return element;
                        }
                    },
                    template: '<div class="modal-header"><h3>Title</h3></div>' +
                        '<div class="modal-body">' +
                        'Translate &quot;<span>{{ element.name }}</span>&quot; into language &quot;{{ lang }}&quot;<br/>' +
                        '<input autofocus class="input-block-level" ng-model="title"/>' +
                        '</div>' +
                        '<div class="modal-footer">' +
                        '<button ng-click="close(title)" class="btn btn-primary">Ok</button>' +
                        '</div>'

                });

                modal.result.then(function (title) {
                    if (title) {
                        element.title = title;
                        I18N.setTitle(element.name, title);
                    }
                });
            };

            $scope.openDocDialog = function (element) {
                var modal = $modal.open({
                    controller: function DocDialogController($scope, $modalInstance, element) {
                        $scope.element = element;
                        $scope.doc = element.doc;
                        $scope.close = function (result) {
                            modal.close(result);
                        };
                    },
                    dialogFade: true,
                    backdrop: true,
                    fadeBackdrop: true,
                    keyboard: true,
                    resolve: {
                        element: function () {
                            return element;
                        }
                    },
                    template: '<div class="modal-header"><h3>Explanation</h3></div>' +
                        '<div class="modal-body">' +
                        'Explain &quot;<span>{{ element.name }}</span>&quot; into language &quot;{{ lang }}&quot;<br/>' +
                        '<textarea autofocus rows="8" ng-model="doc" class="form-control"></textarea>' +
                        '</div>' +
                        '<div class="modal-footer">' +
                        '<button ng-click="close(doc)" class="btn btn-primary">Ok</button>' +
                        '</div>' +
                        '</div>'

                });
                modal.result.then(function (doc) {
                    if (doc) {
                        element.doc = doc;
                        I18N.setDoc(element.name, doc);
                    }
                });
            };
        }
);




