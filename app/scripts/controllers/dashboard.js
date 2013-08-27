var OSCR = angular.module('OSCR');

OSCR.controller(
    'DashboardController',
    function ($rootScope, $scope, $location, $cookieStore, Statistics) {
        $rootScope.checkLoggedIn();

        Statistics.getGlobalStatistics(function (statistics) {
            $scope.statistics = statistics;
        });

        Statistics.getLogEntries(function (entries) {
            $scope.logEntries = entries;
        });

    }
);

OSCR.filter(
    'logDetails',
    function () {
        return function (entry, type) {
            if (entry) {
                switch (type) {
                    case 'whoHref':
                        return '/user/' + entry.Who;
                        break;
                    case 'detailHref':
                        switch (entry.Op) {
                            case 'Authenticate':
                                return '-';
                            case 'TranslateTitle':
                            case 'TranslateDoc':
                            case 'TranslateLabel':
                                return '/lang/' + entry.Lang;
                            case 'SaveGroup':
                                return '/group/' + entry.Identifier;
                            case 'AddUserToGroup':
                            case 'RemoveUserFromGroup':
                                return '/group/' + entry.GroupIdentifier;
                            case 'AddVocabularyEntry':
                                return '/vocab/' + entry.Vocabulary;
                            case 'SaveDocument':
                                return '/document/' + entry.Identifier;
                        }
                        break;
                    default:
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
                        break;
                }
            }
            return '??';
        };
    }
);

