'use strict';

var OSCR = angular.module('OSCR');

function log(message) {
//    console.log(message);
}

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
                return element.value.Description;
            }
            else {
                return element.value;
            }
        };
    }
);

OSCR.filter('mediaDisplay',
    function () {
        return function (element) {
            if (element.value && element.media) {
                return '/media/thumbnail/' + element.value.Identifier;
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
        $scope.schama = $scope.el.config.media;

        if (!$scope.m.tree) {
            Document.fetchSchema($scope.schema, function (schema) {
                $scope.m.tree = {
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
                Document.fetchDocument($scope.schema, $scope.el.value.Identifier, function (fetchedValue) {
                    log('fetched media record');
                    log(fetchedValue.Document);
                    $scope.setValue(fetchedValue.Document);
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
            if (!media) {
                return [];
            }
            log('media to string');
            log(media);
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
            $scope.el.value = angular.copy(value.Body.ImageMetadata);
            $scope.el.value.Identifier = value.Header.Identifier;
            if ($scope.m.tree) {
                $scope.el.valueFields = _.map($scope.m.tree.elements, function (element) {
                    return  { prompt: element.name, value: $scope.el.value[element.name] };
                });
            }
            $scope.disableEditor();
        };

    }
);

OSCR.controller(
    'VocabularyController',
    function ($scope, $q, Vocabulary, Document) {
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
                    elements: schema.elements[0].elements
                };
            });
        }

        if (!$scope.valueChecked) {
            if ($scope.el.value) {
                Document.fetchDocument($scope.schema, $scope.el.value.ID, function (fetchedValue) { // todo: ID and Identifier?
                    log('fetched media record');
                    log(fetchedValue.Document);
                    $scope.setValue(fetchedValue.Document);
                });
            }
            $scope.valueChecked = true;
        }

        $scope.getStates = function (query) {
            var deferred = $q.defer();
            Vocabulary.select($scope.schema, query, function (list) {
                deferred.resolve(list);
            });
            return deferred.promise;
        };

        $scope.createNew = function (index, parentIndex) {
            if ($scope.el.tree) {
                $scope.el.elements = _.filter($scope.el.tree.elements, function (el) {
                    el.value = null;
                    return el.name != 'ID'; // todo: how do we know this?
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
            $scope.chosenState = null;
            $scope.el.value = null;
            $scope.el.valueFields = null;
            $scope.enableEditor();
        };

        $scope.$watch('chosenState', function (after, before) {
            if (_.isObject(after)) {
                $scope.setValue(after);
            }
        });

        $scope.stateToString = function (state) {
            if (!state) {
                return [];
            }
            return state.Label; // todo
        };

        $scope.setValue = function (value) {
            $scope.el.value = value;
            if ($scope.el.tree) {
                $scope.el.valueFields = _.map($scope.el.tree.elements, function (element) {
                    return  { prompt: element.name, value: value[element.name] };
                });
            }
        };
    }
);

OSCR.controller(
    'TextInputController',
    function ($scope, Validator) {
        if (!$scope.el.config.line) {
            return;
        }
        $scope.setActive('textInput');
        if ($scope.el.value === undefined) {
            $scope.enableEditor();
        }
        $scope.validators = [];

        if ($scope.el.config.validator) {
            var func = Validator.getFunction($scope.el.config.validator);
            if (func) {
                $scope.validators.push(func);
            }
            else {
                console.warn('Validator not found: ' + $scope.el.config.validator);
            }
        }

        if ($scope.el.config.required) {
            $scope.validators.push(Validator.getFunction('required'));
        }

        if ($scope.validators.length) {
            console.log('validators! '+$scope.validators.length);
            $scope.$watch('el.value', function (after, before) {
                var invalid = 0;
                $scope.invalidMessage = '';
                _.each($scope.validators, function (validator) {
                    if ($scope.invalid) return;
                    var message = validator(after);
                    if (message) {
                        var colon = message.indexOf(':');
                        if (colon > 0) {
                            invalid = parseInt(message.substring(0, colon));
                            message = message.substring(colon + 1);
                        }
                        else {
                            invalid = 1;
                        }
                        $scope.invalidMessage = message;
                    }
                });
                $scope.setInvalid(invalid); // in PanelController, for all panels
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
