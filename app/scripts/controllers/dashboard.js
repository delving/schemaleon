var OSCR = angular.module('OSCR');

OSCR.controller(
    'DashboardController',
    function ($rootScope, $scope, $location, $cookieStore, Statistics, Person) {
        $rootScope.checkLoggedIn();

        Statistics.getGlobalStatistics(function (statistics) {
            $scope.statistics = statistics;
        });

        Statistics.getLogEntries(function (entries) {
            $scope.logEntries = _.sortBy(entries, function (val) {
                return -val.TimeStamp;
            });

        });

        $scope.logEntryWho = function (entry) {
            $scope.choosePath('/people/user/' + entry.Who);
        };

        $scope.logEntryDetail = function (entry) {
            var path = null;
            switch (entry.Op) {
                case 'Authenticate':
                    break;
                case 'TranslateTitle':
                case 'TranslateDoc':
                case 'TranslateLabel':
                    path = '/lang/' + entry.Lang;
                    break;
                case 'SaveGroup':
                    path = '/people/group/' + entry.Identifier;
                    break;
                case 'AddUserToGroup':
                case 'RemoveUserFromGroup':
                    path = '/people/group/' + entry.GroupIdentifier;
                    break;
                case 'AddVocabularyEntry':
                    path = '/vocab/' + entry.Vocabulary;
                    break;
                case 'SaveDocument':
                    path = '/document/' + entry.SchemaName + '/edit/' + entry.Identifier;
                    break;
            }
            if (path) {
                $scope.choosePath(path);
            }
        };

        $scope.getMe = function (entry) {
            Person.getUser(entry.Who, function(user) {
                _.each($scope.logEntries, function(logEntry) {
                    if (logEntry.Who == entry.Who) {
                        logEntry.userView = user;
                    }
                });
            });
        }



    }
);

OSCR.filter(
    'logDetails',
    function () {
        return function (entry, type) {
            if (entry) {
                switch (entry.Op) {
                    case 'Authenticate':
                        return '-';
                    case 'TranslateTitle':
                    case 'TranslateDoc':
                    case 'TranslateLabel':
                        return entry.Lang + ':' + entry.Key + '=' + entry.Value.replace(/\n/g, ' ');
                        break;
                    case 'SaveGroup':
                        return entry.Identifier;
                    case 'AddUserToGroup':
                    case 'RemoveUserFromGroup':
                        return entry.UserIdentifier + ':' + entry.UserRole + ' ' + entry.GroupIdentifier;
                    case 'AddVocabularyEntry':
                        return entry.Vocabulary + ':' + entry.Entry.Identifier;
                    case 'SaveDocument':
                        return entry.Identifier;
                }
            }
            return '??';
        };
    }
);

