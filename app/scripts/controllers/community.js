var OSCR = angular.module('OSCR');

OSCR.controller(
    'CommunityController',
    function ($rootScope, $scope, $location, $anchorScroll, $cookieStore, $timeout, Statistics, Person) {
        $rootScope.checkLoggedIn();

        Statistics.getLogEntries(function (entries) {
            $scope.logEntries = _.sortBy(entries, function (val) {
                return -val.TimeStamp;
            });

            // find unique user id's and map them. then fetch Person Profile for display of email
            var userIds = _.uniq(_.map($scope.logEntries, function(logEntry){
                return logEntry.Who;
            }));
            _.each(userIds, function(id){
                Person.getUser(id, function(user) {
                    _.each($scope.logEntries, function(element) {
                        if (id == element.Who) {
                            element.userView = user;
                        }
                    });
                });
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
                    // todo: not entirely sure this works yet
                    if (entry.GroupIdentifier) {
                        path = '/primary/' + entry.SchemaName + '/' + entry.GroupIdentifier + '/' + entry.Identifier + '/edit';
                    }
                    else {
                        path = '/shared/' + entry.SchemaName + '/' + entry.Identifier + '/edit';
                    }
                    break;
            }
            if (path) {
                $scope.choosePath(path);
            }
        };

        $scope.chatMessage = '';
        $scope.chatMessageSend = false;
        $scope.chatMessageList = [];

        var chatPollPromise;

        function chatPoll() {
            $location.hash('chat-bottom');
            $anchorScroll();
            if ($scope.chatMessageSend) {
                Person.publishChatMessage($scope.chatMessage, function (messageList) {
                    $scope.chatMessageSend = false;
                    $scope.chatMessage = '';
                    $scope.chatMessageList = messageList;
                });
            }
            else {
                Person.publishChatMessage('', function (messageList) {
                    $scope.chatMessageList = messageList;
                });
            }
            chatPollPromise = $timeout(chatPoll, 5000);
        }
        chatPoll();

        $scope.chatSend = function(chatMessage) {
            $scope.chatMessage = chatMessage;
            if (chatPollPromise) {
                $timeout.cancel(chatPollPromise);
                chatPollPromise = null;
            }
            $scope.chatMessageSend = true;
            chatPoll();
        };
    }
);

OSCR.directive('chatEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.chatEnter);
                });
                event.preventDefault();
            }
        });
    };
});

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

