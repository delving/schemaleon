'use strict';

// todo: this should replace field.js

var OSCR = angular.module('OSCR');

OSCR.controller(
    'TextInputController',
    function ($scope) {
        if (!($scope.el.config.line || $scope.el.config.paragraph)) {
            console.warn("TextInputController used in the wrong place");
            return;
        }
        $scope.$watch('el.value', function (after, before) {
            if (after) {
                $scope.valueChanged($scope.el);
            }
        });
    }
);

OSCR.controller(
    'VocabularySearchController',
    function ($scope, Vocabulary) {
        $scope.el = $scope.panel.element;

        if (!$scope.el.config.vocabulary) {
            console.warn("VocabularySearchController used in the wrong place");
            return;
        }
        if (!$scope.el.vocabularyTree) {
            Vocabulary.getSchema($scope.el.config.vocabulary, function (schema) {
                $scope.el.vocabularyTree = {
                    name: 'Entry',
                    elements: schema.elements[0].elements,
                    config: schema.elements[0].config
                };
                if ($scope.el.value) {
                    $scope.setValue($scope.el.value);
                }
            });
        }

        $scope.getEntries = function (query) {
            $scope.query = query;
            var deferred = $q.defer();
            var lookup = $scope.el.tree ? $scope.el.tree.config.lookup : null;
            Vocabulary.select($scope.schema, query, lookup, function (list) {
//                console.log('vocab select '+list.length);
//                console.log(list);
                var lookupEntries = null;
                var entries = _.filter(list, function (item) {
                    if (item.Entry) {
                        lookupEntries = item.Entry;
                        return false;
                    }
                    return true;
                });
                if (lookupEntries) {
                    entries = entries.concat(_.map(lookupEntries, function (entry) {
                        entry.source = lookup;
                        return entry;
                    }));
                }
//                console.log('lookup entries');
//                console.log(JSON.stringify(entries));
                deferred.resolve(entries);
            });
            return deferred.promise;
        };

        $scope.setValue = function (value) {
            $scope.el.value = value;
            if ($scope.el.vocabularyTree) {
                $scope.el.valueFields = _.map($scope.el.vocabularyTree.elements, function (element) {
                    return  {
                        prompt: element.name,
                        value: value[element.name]
                    };
                });
            }
        };

        $scope.createNewValue = function () {
            // todo: are you sure question;
            var newValue = {
                "Entry": {
                    "Label": $scope.el.searchValue
                }
            };
            Vocabulary.add($scope.el.config.vocabulary, newValue, function (entry) {
                $scope.setValue(entry.Entry);
                console.log('saved ' + JSON.stringify(entry.Entry));
            });
        };

        $scope.$watch('el.searchValue', function (newSearchValue, before) {
            if (newSearchValue) {
                console.log("search value changed from ["+before+"] to ["+newSearchValue+"]");
                Vocabulary.select($scope.schema, newSearchValue, null, function (list) {
                    console.log('vocab select '+list.length);
                    console.log(list);
//                    var lookupEntries = null;
//                    var entries = _.filter(list, function (item) {
//                        if (item.Entry) {
//                            lookupEntries = item.Entry;
//                            return false;
//                        }
//                        return true;
//                    });
//                    if (lookupEntries) {
//                        entries = entries.concat(_.map(lookupEntries, function (entry) {
//                            entry.source = lookup;
//                            return entry;
//                        }));
//                    }
//                    console.log('lookup entries');
//                    console.log(JSON.stringify(entries));
//                    $scope.entries = entries;
                });
            }
        });
    }
);


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
                return element.value.Identifier;
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

        function refreshList() {
            Document.fetchAllDocuments($scope.schema, function(list) {
                $scope.mediaList = list;
            });
        }
        refreshList();

        if (!$scope.valueChecked) {
            if ($scope.el.value) {
//                $scope.disableEditor();
                Document.fetchDocument($scope.schema, $scope.el.value.Identifier, function (fetchedValue) {
//                    log('fetched media record');
//                    log(fetchedValue.Document);
                    $scope.chosenMedia = fetchedValue.Document;
                });
            }
            $scope.valueChecked = true;
        }

        $scope.selectMedia = function(entry) {
            console.log("selected media ", entry);
            $scope.setValue(entry);
        };

        $scope.enableMediaEditor = function () {
            $scope.chosenMedia = null;
            $scope.el.value = null;
            $scope.el.valueFields = null;
//            $scope.enableEditor();
        };

        $scope.setValue = function (value) {
            $scope.el.value = angular.copy(value.Body.MediaMetadata);
            $scope.el.value.Identifier = value.Header.Identifier;
            if ($scope.el.tree) {
                $scope.el.valueFields = _.map($scope.el.tree.elements, function (element) {
                    return  { prompt: element.name, value: $scope.el.value[element.name] };
                });
            }
//            $scope.disableEditor();
        };

        $scope.showImagePreview = function(id){
            var elThumb = '#oscr-media-grid-thumb-'+id;
            var elBig = '#oscr-media-grid-big-'+id;
            var position = $(elThumb).position();
            $(elBig).css({"display":"block"});
        };

        $scope.hideImagePreview = function(id){
            var elBig = '#oscr-media-grid-big-'+id;
            $(elBig).css({"display": "none"});
        };

        $scope.openImageUploadDialog = function () {
            var dialog = $dialog.dialog({
                dialogFade: true,
                backdrop: true,
                fadeBackdrop: true,
                keyboard: true,
                controller: 'MediaUploadController',
                templateUrl: 'views/media-lite.html'
            });
//            dialog.open().then(function () {
//                refreshList();
//            });
        };

        $scope.refreshImageList = function () {
            refreshList();
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
    function ($scope, $q, Vocabulary, $rootScope) {

        if (!$scope.el.config.vocabulary) {
            console.log("No vocabulary around!");// todo: remove
            return;
        }
        $scope.schema = $scope.el.config.vocabulary;

        if (!$scope.el.tree) {
            Vocabulary.getSchema($scope.schema, function (schema) {
                $scope.el.tree = {
                    name: 'Entry',
                    elements: schema.elements[0].elements,
                    config: schema.elements[0].config
                };
                if ($scope.el.value) {
                    $scope.setValue($scope.el.value);
                }
            });
        }

        $scope.enableVocabularyEditor = function () {
            console.log("enableVocabularyEditor", $scope.el);
            $scope.enableEditor();
            $scope.el.searching = true;
//            $scope.el.value = null;
//            $scope.el.valueFields = null;
        };

        $scope.getEntries = function (query) {
            $scope.query = query;
            var deferred = $q.defer();
            var lookup = $scope.el.tree ? $scope.el.tree.config.lookup : null;
            Vocabulary.select($scope.schema, query, lookup, function (list) {
//                console.log('vocab select '+list.length);
//                console.log(list);
                var lookupEntries = null;
                var entries = _.filter(list, function (item) {
                    if (item.Entry) {
                        lookupEntries = item.Entry;
                        return false;
                    }
                    return true;
                });
                if (lookupEntries) {
                    entries = entries.concat(_.map(lookupEntries, function (entry) {
                        entry.source = lookup;
                        return entry;
                    }));
                }
//                console.log('lookup entries');
//                console.log(JSON.stringify(entries));
                deferred.resolve(entries);
            });
            return deferred.promise;
        };

        $scope.createNew = function (index, parentIndex) {
            var typedValue = $scope.query;
            if ($scope.el.tree) {
                $scope.el.elements = _.filter($scope.el.tree.elements, function (treeElement) {
                    treeElement.value = treeElement.name == 'Label' ? $scope.query : null;
                    treeElement.suspendValidation = true;
                    return treeElement.name != 'Identifier';
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
                console.log('saved ' + JSON.stringify(entry.Entry));
//                $scope.disableEditor();
            });
        };

        $scope.cancelNew = function () {
            $scope.el.elements = null;
            $scope.panels.pop(); // kill the new element input panel
        };

        $scope.enableClearedEditor = function () {
            if ($rootScope.config.showTranslationEditor) return;
            $scope.chosenEntry = null;
            $scope.el.value = null;
            $scope.el.valueFields = null;
            $scope.enableEditor();
        };

        $scope.$watch('chosenEntry', function (after, before) {
            if (_.isObject(after)) {
                $scope.setValue(after);
                if (after.source) {
                    delete after.source;
                    populateTree($scope.el.tree, { Entry: after });
                    $scope.submitNew();
                }
            }
        });

        $scope.entryToString = function (entry) {
            if (!entry || !entry.Label) return '';
            if (entry.source) {
                return entry.source + ': ' + entry.Label;
            }
            else {
                return entry.Label;
            }
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
                            $scope.el['valueField' + field.prompt] = field; // a naughty side effect
                            return false;
                        }
                        return !!field.value;
                    }
                );
            }
//            $scope.disableEditor();
        };

        if (!$scope.el.suspendValidation) {
            $scope.$watch('el.value', function (after, before) {
                $scope.revalidate();
            });
        }
    }
);
