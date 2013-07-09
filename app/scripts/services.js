var CultureCollectorApp = angular.module('CultureCollectorApp');

CultureCollectorApp.service("Docs", function ($http, $log) {
    this.fetchDocument = function (identifier, success) {
        $http.get('/document/' + identifier)
            .success(function (data, status, headers, config) {
                success(data);
            })
            .error(function (data, status, headers, config) {
                alert('Problem fetching document');
            });
    };
});

CultureCollectorApp.service("ObjectList", function ($http) {
    this.fetchList = function (success) {
        $http.get('/doclist')
            .success(function (data, status, headers, config) {
                success(data);
            })
            .error(function (data, status, headers, config) {
                alert('Problem fetching document list');
            });
    };
});

CultureCollectorApp.service("Vocabulary", function ($http) {
    this.getStates = function (vocab, value, success) {
        $http.get('/vocabulary/' + vocab, {params: {q: value}})
            .success(function (data, status, headers, config) {
                success(data);
            })
            .error(function (data, status, headers, config) {
                alert("Problem accessing vocabulary");
            });
    };
});