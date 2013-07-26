'use strict';

var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.service("Document",
    function ($http) {
        this.fetchSchema = function (schemaName, success) {
            $http.get('/document/schema/' + schemaName)
                .success(function (data, status, headers, config) {
                    success(data);
                })
                .error(function (data, status, headers, config) {
                    alert('Problem fetching document');
                });
        };
        this.fetchList = function (success) {
            success([
                {
                    identifier: 'Item123',
                    appellation: 'Lorem rips -em',
                    status: 'incomplete'
                },
                {
                    identifier: 'Item234',
                    appellation: 'Lorem updown',
                    status: 'complete'
                },
                {
                    identifier: 'Item345',
                    appellation: 'Solor delar sammit',
                    status: 'incomplete'
                }
            ]);
//            $http.get('/document')
//                .success(function (data, status, headers, config) {
//                    success(data);
//                })
//                .error(function (data, status, headers, config) {
//                    alert('Problem fetching document list');
//                });
        };
        this.save = function (xml, receiver) {
            $http.post('/document/save', entry)
                .success(function (data, status, headers, config) {
                    receiver(data);
                })
                .error(function (data, status, headers, config) {
                    alert("Problem accessing vocabulary");
                });
        }
    }
);