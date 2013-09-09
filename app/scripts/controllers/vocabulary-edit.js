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
    'VocabularyEditController',
    function ($rootScope, $scope, $routeParams, Vocabulary) {
        $scope.vocabularyName = $routeParams.vocab;

        $scope.entries = [];

        Vocabulary.get($scope.vocabularyName, function (vocabulary) {
            $scope.entries = _.map(xmlArray(vocabulary.Entries.Entry), function (entry) {
                var fields = [];
                _.each(_.pairs(entry), function (pair) {
                    if (!(pair[0][0] == '$' && pair[0] == 'Label' || pair[0] == 'Identifier')) {
                        fields.push({ Key: pair[0], Value: pair[1]});
                    }
                });
                entry.fields = fields;
                return entry;
            });
            $scope.vocabulary = vocabulary;
        });
    }
);
