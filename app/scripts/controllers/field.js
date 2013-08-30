'use strict';

var OSCR = angular.module('OSCR');

OSCR.filter('elementDisplay',
    function () {
        return function (element) {
            if (!element.value) {
                return 'empty';
            }
            else if (element.config.vocabulary) {
                return element.value.Label; // todo
            }
            else if (element.config.media) {
                log('elementDisplay');
                log(element.value);
                return element.value.Notes;
            }
            else {
                return element.value;
            }
        };
    }
);

OSCR.filter('mediaThumbnail',
    function () {
        return function (element) {
            if (element.value && element.config.media) {
                return '/media/thumbnail/' + element.value.Identifier;
            }
            else {
                return '';
            }
        };
    }
);

OSCR.filter('mediaLabel',
    function () {
        return function (element) {
            if (_.isString(element.value)) {
                return element.value;
            }
            else if (element.value) {
                return element.value.Label;
            }
            else {
                return '';
            }
        };
    }
);

OSCR.controller(
    'MediaController',
    function ($scope, $q, Document) {
        if (!$scope.el.config.media) {
            return;
        }
        $scope.setActive('media');
        $scope.chosenMedia = null;
        $scope.schema = $scope.el.config.media;

        if (!$scope.el.tree) {
            Document.fetchSchema($scope.schema, function (schema) {
                $scope.el.tree = {
                    name: 'Entry',
                    elements: schema.elements
                };
            });
        }

        if ($scope.el.value === undefined) {
            $scope.enableEditor();
        }

        if (!$scope.valueChecked) {
            if ($scope.el.value) {
                $scope.disableEditor();
                Document.fetchDocument($scope.schema, $scope.el.value.Identifier, function (fetchedValue) {
//                    log('fetched media record');
//                    log(fetchedValue.Document);
                    $scope.chosenMedia = fetchedValue.Document;
                });
            }
            $scope.valueChecked = true;
        }

        $scope.getMediaList = function (search) {
            var deferred = $q.defer();
            Document.selectDocuments($scope.schema, search, function (list) {
                deferred.resolve(list);
            });
            return deferred.promise;
        };

        $scope.mediaToString = function (media) {
            log('media to string');
            log(media);
            if (!media) {
                return [];
            }
            return media.Header.Label; // todo
        };

        $scope.$watch('chosenMedia', function (after, before) {
            if (_.isObject(after)) {
                $scope.setValue(after);
            }
        });

        $scope.enableClearedEditor = function () {
            $scope.chosenMedia = null;
            $scope.el.value = null;
            $scope.el.valueFields = null;
            $scope.enableEditor();
        };

        $scope.setValue = function (value) {
            $scope.el.value = angular.copy(value.Body.MediaMetadata);
            $scope.el.value.Identifier = value.Header.Identifier;
            if ($scope.el.tree) {
                $scope.el.valueFields = _.map($scope.el.tree.elements, function (element) {
                    return  { prompt: element.name, value: $scope.el.value[element.name] };
                });
            }
            $scope.disableEditor();
        };

        if (!$scope.el.suspendValidation) {
            $scope.$watch('el.value', function (after, before) {
                $scope.revalidate();
            });
        }
    }
);

OSCR.controller(
    'VocabularyController',
    function ($scope, $q, Vocabulary) {

        function log(message) {
            console.log(message);
        }

        if (!$scope.el.config.vocabulary) {
            return;
        }
        $scope.setActive('vocabulary');
        $scope.schema = $scope.el.config.vocabulary;
        if ($scope.el.value === undefined) {
            $scope.enableEditor();
        }
        if (!$scope.el.tree) {
            Vocabulary.getSchema($scope.schema, function (schema) {
                $scope.el.tree = {
                    name: 'Entry',
                    elements: schema.elements[0].elements,
                    config: {}
                };
            });
        }

        if (!$scope.valueChecked) {
            if ($scope.el.value) {
                Vocabulary.fetchEntry($scope.schema, $scope.el.value.Identifier, function (fetchedValue) {
                    $scope.chosenEntry = fetchedValue.Entry;
                });
            }
            $scope.valueChecked = true;
        }

        $scope.getEntries = function (query) {
            var deferred = $q.defer();
            Vocabulary.select($scope.schema, query, function (list) {
                console.log(list);
                deferred.resolve(list);
            });
            return deferred.promise;
        };

        $scope.createNew = function (index, parentIndex) {
            if ($scope.el.tree) {
                $scope.el.elements = _.filter($scope.el.tree.elements, function (el) {
                    el.value = null;
                    el.suspendValidation = true;
                    return el.name != 'Identifier';
                });
                $scope.choose(0, parentIndex);
            }
        };

        $scope.submitNew = function () {
            $scope.newValue = treeToObject($scope.el.tree);
            Vocabulary.add($scope.schema, $scope.newValue, function (entry) {
                $scope.panels.pop();
                $scope.el.elements = null;
                $scope.setValue(entry.Entry);
                $scope.disableEditor();
            });
        };

        $scope.cancelNew = function () {
            $scope.el.elements = null;
            $scope.panels.pop(); // kill the new element input panel
        };

        $scope.enableClearedEditor = function () {
            $scope.chosenEntry = null;
            $scope.el.value = null;
            $scope.el.valueFields = null;
            $scope.enableEditor();
        };

        $scope.$watch('chosenEntry', function (after, before) {
            if (_.isObject(after)) {
                $scope.setValue(after);
            }
        });

        $scope.entryToString = function (entry) {
            if (!entry) return '';
            return entry.Label;
        };

        $scope.setValue = function (value) {
            $scope.el.value = value;
            if ($scope.el.tree) {
                $scope.el.valueFields = _.filter(
                    _.map(
                        $scope.el.tree.elements,
                        function (element) {
                            return  { prompt: element.name, value: value[element.name] };
                        }
                    ),
                    function (field) {
                        if (field.prompt === 'Identifier' || field.prompt === 'Label') {
                            $scope.el['valueField'+field.prompt] = field; // a naughty side effect
                            return false;
                        }
                        return !!field.value;
                    }
                );
            }
            $scope.disableEditor();
        };

        if (!$scope.el.suspendValidation) {
            $scope.$watch('el.value', function (after, before) {
                $scope.revalidate();
            });
        }
    }
);

OSCR.controller(
    'TextInputController',
    function ($scope) {
        if (!$scope.el.config.line) {
            return;
        }
        $scope.setActive('textInput');
        if ($scope.el.value === undefined) {
            $scope.enableEditor();
        }

        if (!$scope.el.suspendValidation) {
            $scope.$watch('el.value', function (after, before) {
                $scope.revalidate();
            });
        }
    }
);

OSCR.controller(
    'TextAreaController',
    function ($scope) {
        if (!$scope.el.config.paragraph) {
            return;
        }
        $scope.setActive('textArea');
        if ($scope.el.value === undefined) {
            $scope.enableEditor();
        }
        if (!$scope.el.suspendValidation) {
            $scope.$watch('el.value', function (after, before) {
                $scope.revalidate();
            });
        }
    }
);

OSCR.controller(
    'HiddenController',
    function ($scope) {
        if ($scope.el.elements) {
            $scope.setActive('hidden');
        }
    }
);
