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
 * Service to fetch statistics and log entries
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

Schemaleon.service(
    "Statistics",
    function ($rootScope, $http) {

        this.getGlobalStatistics = function (groupIdentifier, accept) {
            $http.get('/statistics/'+groupIdentifier).success(function (xml) {
                accept(xmlToObject(xml).Statistics);
            });
        };

        this.getLogEntries = function(accept) {
            $http.get('/log').success(function (xml) {
                accept(xmlToArray(xml));
            });
        };
    }
);