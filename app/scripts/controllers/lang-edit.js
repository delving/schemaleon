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
    'LangEditController',
    function ($rootScope, $scope, $routeParams, I18N) {

        $scope.langCode = $routeParams.lang;

        function setLanguage(lang) {
            $scope.labels = [];
            _.each(_.pairs(lang.label), function(pair) {
                $scope.labels.push({
                    Key: pair[0],
                    Value: pair[1],
                    StoredValue: pair[1]
                });
            });
            $scope.elements = [];
            for (var key in lang.element) {
                $scope.elements.push({
                    Key: key,
                    Title: lang.element[key].title,
                    StoredTitle: lang.element[key].title,
                    Doc: lang.element[key].doc,
                    StoredDoc: lang.element[key].doc
                });
            }
            if ($scope.langCode == $rootScope.lang) {
                $rootScope.i18n = lang;
            }
        }

        I18N.getList($scope.langCode, function(lang) {
            setLanguage(lang);
        });

        $scope.setLabel = function(label) {
            I18N.setLabelAsync($scope.langCode, label.Key, label.Value, function(lang) {
                setLanguage(lang);
            });
        };

        $scope.setTitle = function(element) {
            I18N.setTitleAsync($scope.langCode, element.Key, element.Title, function(lang) {
                setLanguage(lang);
            });
        };

        $scope.setDoc = function(element) {
            I18N.setDocAsync($scope.langCode, element.Key, element.Doc, function(lang) {
                setLanguage(lang);
            });
        };
    }
);
