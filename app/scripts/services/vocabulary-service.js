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

var Schemaleon = angular.module('Schemaleon');

/**
 * Service for accessing and modifying vocabularies
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

Schemaleon.service(
    "Vocabulary",
    function ($http) {

//        for now, all vocabulary schemas are just Identifier/Label
//        this.getSchema = function (vocab, accept) {
//            $http.get('/vocabulary/' + vocab).success(function (data) {
//                accept(xmlToTree(data));
//            });
//        };

        this.fetchEntry = function (vocab, identifier, accept) {
            $http.get('/vocabulary/' + vocab + "/fetch/" + identifier).success(function (data) {
                accept(xmlToObject(data));
            });
        };

        this.select = function (vocab, query, accept) {
            $http.get('/vocabulary/' + vocab + "/select", {params: {q: query}}).success(function (data) {
                accept(xmlToArray(data));
            });
        };

        this.get = function (vocab, accept) {
            $http.get('/vocabulary/' + vocab + '/all').success(function (data) {
                accept(xmlToObject(data));
            });
        };

        this.add = function (vocab, entry, accept) {
            $http.post('/vocabulary/' + vocab + "/add", entry).success(function (data) {
                accept(xmlToObject(data));
            });
        };
    }
);