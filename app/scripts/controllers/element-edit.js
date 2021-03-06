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

'use strict';

var Schemaleon = angular.module('Schemaleon');

/*
 * Various controllers for editing specific field types
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

Schemaleon.controller(
    'TextInputController',
    function ($scope) {
        if (!($scope.el.config.line || $scope.el.config.paragraph)) {
            console.warn("TextInputController used in the wrong place");
            return;
        }

        $scope.$watch('el.value', function (after, before) {
            if (after && after.length) {
                $scope.valueChanged($scope.el);
                $scope.displayValue = after;
            }
            else {
                $scope.displayValue = '-';
            }
        });
    }
);

Schemaleon.controller(
    'VocabularyController',
    function ($scope) {

        if (!$scope.el.config.vocabulary) {
            return;
        }
        $scope.schema = $scope.el.config.vocabulary;

        $scope.$watch('chosenEntry', function (value, before) {
            if (_.isObject(value)) {
                $scope.el.value = value;
            }
        });

        $scope.$watch('el.value', function (after, before) {
            $scope.valueChanged($scope.el);
            $scope.displayValue = after ? after.Label : '-';
        });
        
//        $scope.enableVocabularyEditor = function () {
//            console.log('vocabulary focussed');
//        };
    }
);
Schemaleon.controller(
    'VocabularySearchController',
    function ($scope, Vocabulary) {

        if ($scope.panel) $scope.el = $scope.panel.element;
        if (!$scope.el.config.vocabulary) return;
        $scope.schema = $scope.el.config.vocabulary;

        $scope.setValue = function (value) {
            $scope.el.value = value;  // vocabulary controller is watching this
            console.log('given value', value);
            console.log('$scope.el.value', $scope.el.value);
            $scope.setEditing(false);
            $scope.el.searchValue = '';
        };

        $scope.createNewValue = function () {
            if ($scope.el.config.vocabularyFixed) return;
            // todo: "are you sure?" question
            var newValue = {
                "Entry": {
                    "Label": $scope.el.searchValue
                }
            };
            Vocabulary.add($scope.schema, newValue, function (entry) {
                $scope.setValue(entry.Entry);
                console.log('saved ' + JSON.stringify(entry.Entry));
            });
        };

        $scope.$watch('el.searchValue', function (newSearchValue, before) {
            if (newSearchValue) {
                Vocabulary.select($scope.schema, newSearchValue, function (entries) {
                    $scope.el.entries = entries;
                });
            }
        });

    }
);

Schemaleon.controller(
    'MediaElementController',
    function ($rootScope, $scope, $modal, $filter) {

        $scope.enableMediaEditor = function (el) {
//            console.log('element-edit.js l.97 enableMediaEditor()', el);
            if (el) $scope.setActiveEl(el);
            $scope.setEditing(true);
        };

        $scope.$watch('el.value', function (value, before) {
            $scope.valueChanged($scope.el);
        });
    }
);

Schemaleon.controller(
    'MediaInputController',
    function ($rootScope, $scope, $q, Document) {
        if ($scope.panel) $scope.el = $scope.panel.element;
//        console.log('element-edit.js l.111 MediaInpuntController $scope.el', $scope.el);
        if (!$scope.el.config.media) return;
        $scope.schema = $scope.el.config.media;
        $scope.groupIdentifier = $rootScope.userGroupIdentifier();

        $scope.setValue = function (value) {
//            console.log('element-edit.js l.117 MediaInputController setValue()', value);
            // make a copy of the body and add header things to it
            var augmented = angular.copy(value.Body.MediaMetadata);
            augmented.Identifier = value.Header.Identifier;
            augmented.GroupIdentifier = value.Header.GroupIdentifier;
            $scope.el.value = augmented;
            $scope.setEditing(false);
            $scope.toggleMediaAsideList();
//            console.log('set value', value);
        };
    }
);

Schemaleon.controller(
    'InstanceController',
    function ($scope) {

        if (!$scope.el.config.instance) return;

        if (_.isArray($scope.el.config.instance)) {
            $scope.el.schemaList = $scope.el.config.instance;
            $scope.el.schema = $scope.el.schemaList[0];
        }
        else {
            $scope.el.schemaList = null;
            $scope.el.schema = $scope.el.config.instance;
        }

        $scope.$watch('chosenEntry', function (value, before) {
            if (_.isObject(value)) {
                $scope.el.value = value;
                // todo: value's identifier as a link
            }
        });

        $scope.isLinkFacts = function() {
            return $scope.el.value && $scope.el.value.LinkFact;
        };

        $scope.isHeader = function() {
            return $scope.el.value && $scope.el.value.Header;
        };

        $scope.$watch('el.value', function (after, before) {
            $scope.el.headerTitle = "-";
            if ($scope.isLinkFacts()) {
                $scope.el.linkFacts = _.map(xmlArray($scope.el.value.LinkFact), function (fact) {
                    return {
                        name: fact.Name,
                        value: fact.Value
                    }
                })
            }
            if ($scope.isHeader()) {
                if ($scope.el.value.Header.SummaryFields) {
                    $scope.el.headerTitle = $scope.el.value.Header.SummaryFields.Title;
                }
            }
            $scope.valueChanged($scope.el);
        });
    }
);

Schemaleon.controller(
    'InstanceSearchController',
    function ($rootScope, $scope, Document) {

        if ($scope.panel) $scope.el = $scope.panel.element;
        if (!$scope.el.config.instance) return;

        $scope.el.searchValue = '';
        $scope.instanceDetails = false;

        $scope.showInstanceDetails = function() {
            $scope.instanceDetails = !$scope.instanceDetails;
        };

        $scope.isLinkFacts = function() {
            return $scope.el.value && $scope.el.value.LinkFact;
        };

        $scope.isHeader = function() {
            return $scope.el.value && $scope.el.value.Header;
        };

        function searchSchemas(searchValue) {
            var searchParams = {
                searchQuery: searchValue
            };
            Document.searchDocuments($scope.el.schema, null, searchParams, function (entries) {
                $scope.el.entries = entries;
            });
        }

        $scope.switchSchemas = function (schemaChoice) {
            $scope.el.schema = schemaChoice;
            searchSchemas($scope.el.searchValue);
        };

        $scope.setValue = function (value) {
            $scope.el.value = {
                Header: value.Header
            };
            $scope.setEditing(false);
        };

        $scope.$watch('el.searchValue', function (searchValue, oldSearchValue) {
            searchSchemas(searchValue);
        });

        $scope.getInstanceDetails = function (schema) {
            if ($scope.editing) {
                if (schema == "Person") {
                    return "instance-details-person.html";
                }
                else if (schema == "Location") {
                    return "instance-details-location.html";
                }
                else if (schema == "Organization") {
                    return "instance-details-organization.html";
                }
                else if (schema == "HistoricalEvent") {
                    return "instance-details-historical-event.html";
                }
                else {
                    return "instance-details-default.html";
                }
            }
            else {
                return '';
            }
        };
    }
);

Schemaleon.controller(
    'FieldDocumentationController',
    function ($scope, Document) {
        $scope.el = $scope.panel.element;
    }
);

