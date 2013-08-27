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

        Vocabulary.get($scope.vocabularyName, function(vocabulary) {
            $scope.vocabulary = vocabulary;
        });
    }
);

OSCR.filter(
    'vocabFields',
    function () {
        return function (entry) {
            var fields = [];
            if (entry) {
                for (var key in entry) {
                    if (key[0] == '$' || key === 'Label' || key === 'Identifier') continue;
                    fields.push({ Key: key, Value: entry[key]});
                }
            }
            return fields;
        };
    }
);

