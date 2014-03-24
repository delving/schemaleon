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

var OSCR = angular.module('OSCR');

/**
 * Handle editing of vocabularies as a whole
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

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
