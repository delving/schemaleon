'use strict';

var OSCR = angular.module('OSCR');


// This class is set when keyboard nav is used.
$('html').on('click',function(){
    $('body').removeClass('keyboard-on');
});

// handle all things that show the tree, whether editing or viewing
OSCR.controller(
    'TreeController',
    function ($rootScope, $scope, $routeParams, $timeout, Document) {

        // the central scope elements
        $scope.tree = null;
        $scope.cleanTree = null;
        $scope.document = null;

        // flags for view ()
        $scope.fullScreenActive = false;

        // constants for triggering server-side substitutions
        $scope.blankIdentifier = '#IDENTIFIER#';
        $scope.blankTimeStamp = '#TIMESTAMP#';

        // things from the URL path
        $scope.schema = $routeParams.schema;
        $scope.groupIdentifier = $routeParams.groupIdentifier;
        $scope.identifier = $routeParams.identifier;

        // some things for display
        $scope.headerDisplay = '';
        $scope.header = {};

        $rootScope.getGroupName($scope.groupIdentifier).then(function(groupName){
            $scope.groupName = groupName;
        });

        // re-internationalize the tree if the language changes
        $scope.$watch('i18n', function (i18n) {
            if ($scope.tree && i18n) {
                i18nTree($scope.tree, i18n);
            }
        });

        $scope.fullScreen = function(){
            $scope.fullScreenActive = !$scope.fullScreenActive;
            if($scope.fullScreenActive){
                $('body').addClass('full-screen');
            }
            else {
                $('body').removeClass('full-screen');
            }
        };

        // keep updating the time if there is a header
        function tick() {
            $timeout(
                function () {
                    if ($scope.header) {
                        $scope.time = updateTimeString($scope.header.TimeStamp);
                    }
                },
                15000
            ).then(tick);
        }
        tick();

        // if the document changes, we set up a new tree for it and populate the tree with it
        $scope.$watch('document', function (document) {
            if (!document) return;
            var emptyDocument = _.isString(document);
            // if document is a string, it's a schema name
            var schema = emptyDocument ? document : document.Header.SchemaName;
            if (!schema) {
                console.warn("Document header has no schema name");
                return;
            }
            Document.fetchSchema(schema, function (tree) {
                if (!tree) {
                    console.warn("No tree was returned for schema "+schema);
                    return;
                }
                installValidators(tree);
                $scope.cleanTree = angular.copy(tree); // keep a clean copy
                if (emptyDocument) {
                    $scope.tree = tree;
                }
                else {
                    $scope.tree = populateTree(tree, document.Body);
                }
                validateTree(tree);
            });
        });

        $scope.getDocumentState = function(header) {
            if (header.DocumentState) {
                return header.DocumentState;
            }
            else {
                return $rootScope.defaultDocumentState($scope.schema);
            }
        };

        $scope.useHeader = function(header) {
            $scope.header.SchemaName = $scope.schema;
            $scope.header.Identifier = header.Identifier;
            $scope.header.GroupIdentifier = header.GroupIdentifier;
            $scope.header.SummaryFields = header.SummaryFields;
            $scope.header.DocumentState = $scope.getDocumentState(header);
            $scope.headerDisplay = header.Identifier === $scope.blankIdentifier ? null : header.SummaryFields.Title;
            delete $scope.header.TimeStamp;
            var millis = parseInt(header.TimeStamp);
            if (!_.isNaN(millis)) {
                $scope.header.TimeStamp = millis;
            }
        };

        // initialize, if there's an identifier we can fetch the document
        if ($scope.identifier) {
            Document.fetchDocument($scope.schema, $scope.groupIdentifier, $scope.identifier, function (document) {
                $scope.useHeader(document.Document.Header);
                $scope.document = document.Document; // triggers the editor
                $scope.addToRecentMenu(document.Document.Header); // reaches down to global.js
            });
        }
        else {
            $scope.useHeader({
                SchemaName: $scope.schema,
                GroupIdentifier: $rootScope.userGroupIdentifier(),
                Identifier: $scope.blankIdentifier
            });
            $scope.document = $scope.schema; // just a name triggers schema fetch
        }
    }
);

// just mind the tabs and their activation and who can see what
OSCR.controller(
    'TabController',
    function ($rootScope, $scope, $timeout) {

        $scope.activeTab ='novice';

        if($rootScope.user && $rootScope.user.viewer) {
            $scope.activeTab = "viewer";
        }


        // toggle tabs between edit and view
        $scope.isTabActive = function (tab) {
            return $scope.activeTab == tab;
        };

        // switch tabs
        $scope.setActiveTab = function(tab) {
            $scope.activeTab = tab;
        };

    }
);

// for the different kinds of tree editing, either panel or expert
OSCR.controller(
    'TreeEditController',
    function ($rootScope, $scope, $timeout, Document) {

        $rootScope.checkLoggedIn();
        
        $scope.viewportHeight = $rootScope.getWindowHeight()-200+'px';

        // for paying attention to whether the document has changed
        $scope.documentJSON = null;
        $scope.documentDirty = false;
        $scope.headerDocumentState = null;
        $scope.saveSuccess = false;

        $scope.leasedDocument = '';
        var leasePollPromise;

        function leasePoll() {
            Document.leaseDocument($scope.leasedDocument, function (documentLeases) {
                if (!$scope.documentDirty) { // todo: doesn't get set when you leave
                    $scope.leasedDocument = '';
                }
                $rootScope.showDocumentsLeased(documentLeases);
            });
            leasePollPromise = $timeout(leasePoll, 10000);
        }
        leasePoll();

        function setDocumentDirty(dirty) {
            if (dirty != $scope.documentDirty) {
                $scope.documentDirty = dirty;
                $rootScope.setDocumentDirty(dirty, $scope.saveDocument, $scope.revertDocument);
                $scope.leasedDocument = $scope.header.Identifier || '';
            }
            if (!dirty) {
                $scope.leasedDocument = '';
            }
         }

        function freezeTree() {
            if (!$scope.tree) return;
            $scope.documentJSON = JSON.stringify(treeToObject($scope.tree), null, 4);
            setDocumentDirty(false);
            $scope.headerDocumentState = null;
        }

        function checkTreeDirty() {
            if (!$scope.tree) return;
            if ($scope.headerDocumentState && $scope.headerDocumentState != $scope.header.DocumentState) {
                setDocumentDirty(true);
                return;
            }
            var json = JSON.stringify(treeToObject($scope.tree), null, 4);
            setDocumentDirty(json != $scope.documentJSON);
            if ($scope.documentDirty) {
                $scope.time = updateTimeString($scope.header.TimeStamp);
            }
        }

        $scope.isDocumentPublic = function() {
            var documentState = $scope.headerDocumentState || $scope.getDocumentState($scope.header);
            return documentState == 'public';
        };

        $scope.isDocumentPresent = function() {
            var documentState = $scope.headerDocumentState || $scope.getDocumentState($scope.header);
            return documentState != 'deleted';
        };

        // for handling focus in element fields
        $scope.editing = false;
        $scope.focusElementArray = [];
        $scope.hiddenFocusElementArray = [];

        $scope.setEditing = function(value) { // must have a function to mutate this primitive
            $scope.editing = value;
        };

        // If the user has role:Viewer then don't show the doc edit form, but only the preview
        if ($rootScope.user && $rootScope.user.viewer) {
            // todo: they should not even see edit
            // todo: and viewer should be normal, editor should be special.  the boolean should give them permission.
            $scope.activeTab = "view";
        }

        // pressing the plus sign adds a sibling to the current parent
        $scope.addSiblingToParent = function (parentElement, childIndex) {
            var sibling = cloneAndPruneTree(parentElement.elements[childIndex]);
            parentElement.elements.splice(childIndex + 1, 0, sibling);
            setDocumentDirty(true);
            return childIndex + 1; // the new position
        };

        // pressing the minus sign removes a child
        $scope.removeSiblingFromParent = function (parentElement, childIndex) {
            var list = parentElement.elements;
            var childName = list[childIndex].name;
            var hasSibling = false;
            if (childIndex > 0 && list[childIndex - 1].name == childName) {
                hasSibling = true;
            }
            if (childIndex < list.length - 1 && list[childIndex + 1].name == childName) {
                hasSibling = true;
            }
            if (hasSibling) {
                list.splice(childIndex, 1);
                if (childIndex >= list.length) {
                    childIndex--;
                }
            }
            setDocumentDirty(true);
            return childIndex;
        };

        // if the tree changes, we set it up
        $scope.$watch('tree', function (tree, oldTree) {
            if (!tree) return;
            installValidators(tree);
            validateTree(tree);
            freezeTree();
        });

        // run the validations in the tree's fields
        $scope.validateTree = function () {
            validateTree($scope.tree);
            checkTreeDirty();
        };

        $scope.chooseListPath = function() {
            $scope.documentList($scope.schema);
        };

        $scope.setDocumentState = function(state) {
            $scope.headerDocumentState = state;
            checkTreeDirty();
        };

        $scope.saveDocument = function () {
            console.log("saveDocument", $scope.header);
            collectSummaryFields($scope.tree, $scope.header);
            $scope.header.DocumentState = $scope.headerDocumentState || $scope.header.DocumentState;
            $scope.header.TimeStamp = $scope.blankTimeStamp;
            $scope.header.SavedBy = $rootScope.user.Identifier;
            Document.saveDocument($scope.header, treeToObject($scope.tree), function (document) {
                $(".alert-saved").show('slow');
                $scope.useHeader(document.Header);
                $scope.tree = populateTree(angular.copy($scope.cleanTree), document.Body);
                freezeTree();
                $scope.saveSuccess = true;
                $timeout(function() {
                    $(".alert-saved").hide('slow');
                    $timeout(function(){
                        $scope.saveSuccess = false;
                    },250);
                }, 5000);
                $scope.choosePath(document.Header); // todo: only if the identifier has been set by this save
            });
        };

        $scope.revertDocument = function() {
            console.log("revertDocument", $scope.header);
            Document.getDocument($scope.schema, $scope.groupIdentifier, $scope.header.Identifier, function(document) {
                $scope.useHeader(document.Header);
                $scope.tree = populateTree(angular.copy($scope.cleanTree), document.Body);
                freezeTree();
            });
        };
    }
);

// handle just the panel array way of editing the tree
OSCR.controller(
    'PanelArrayController',
    function ($rootScope, $scope, $timeout) {

        $scope.panels = [];
        $scope.choice = 0;
        $scope.selectedPanelIndex = 0;

        $scope.activeEl = null;

        $scope.isEditing = function(el) {
            return $scope.isActiveEl(el) && $scope.editing;
        };

        $scope.$watch('tree', function (newTree, oldTree) {
            if (!newTree) return;
            $scope.panels = [
                { selected: 0, element: newTree }
            ];
            $scope.choose(0, 0);
        });

        $scope.setActiveEl = function (el) {
            $scope.activeEl = el;
            $timeout(function () {
                var fe;
                if ($scope.editing) {
                    fe = $scope.focusElementArray[el.focusElementIndex];
                }
                else {
                    fe = $scope.hiddenFocusElementArray[el.hiddenFocusElementIndex];
                }
                if (fe) {
//                    console.log('requesting ' + $scope.editing + ' focus ' + el.name); // todo remove
                    fe.focus();
                }
                else {
                    console.warn("no focus element for ", el);
                }
            });
        };

        $scope.isActiveEl = function (el) {
            return $scope.activeEl === el;
        };

        $scope.valueChanged = function (el) {
            var elIsActive = (el == $scope.activeEl);
            if (elIsActive) {
                $scope.validateTree();
            }
        };

        $scope.choose = function (choice, panelIndex) {
            $scope.choice = choice;
            $scope.selectedPanelIndex = panelIndex;
            var parentPanel = $scope.panels[panelIndex];
            parentPanel.selected = choice;
            var chosen = parentPanel.element.elements[choice];
            parentPanel.element.elements.forEach(function (el) {
                el.classIndex = panelIndex;
                if (el === chosen) {
                    el.classIndex++;
                }
            });
            var childPanel = $scope.panels[panelIndex + 1] = {
                selected: 0,
                element: chosen
            };
            if (chosen.elements) {
                chosen.elements.forEach(function (el) {
                    el.classIndex = panelIndex + 1;
                });
            }
            $scope.panels.splice(panelIndex + 2, 5);

            // slide panels over
            var scroller = $('#panel-container'),
                table = $('#panel-table'),
                wTable = table.width(),
                leftPos = scroller.scrollLeft();

            scroller.animate({scrollLeft: leftPos + wTable}, 800);
            $scope.setActiveEl(chosen);
            $rootScope.scrollToTop();
        };

        $scope.addSibling = function (parentElement, index, panelIndex) {
            var indexToChoose = $scope.addSiblingToParent(parentElement, index);
            $scope.choose(indexToChoose, panelIndex)
        };

        $scope.removeSibling = function (parentElement, index, panelIndex) {
            var indexToChoose = $scope.removeSiblingFromParent(parentElement, index);
            $scope.choose(indexToChoose, panelIndex);
        };

        $scope.getPanelEditTemplate = function (el) {
            if (el.elements) return "panel-submenu.html";
            if (el.config.line) return "panel-line.html";
            if (el.config.paragraph) return "panel-paragraph.html";
            if (el.config.vocabulary) return "panel-vocabulary.html";
            if (el.config.media) return "panel-media.html";
            if (el.config.instance) return "panel-instance.html";
            return "panel-unrecognized.html"
        };

        $scope.getDetailView = function (el) {
            if (!el) {
                console.warn("get detail view of nothing");
                return "panel-unrecognized.html";
            }
            if ($scope.editing) {
                if (el.config.media) {
                    return "panel-media-search.html";
                }
                else if (el.config.vocabulary) {
                    return "panel-vocabulary-search.html";
                }
                else if (el.config.instance) {
                    return "panel-instance-search.html";
                }
            }
            return "panel-field-documentation.html"
        };
    }
);

// a single element within a panel, editing and some keyboard navigation
OSCR.controller(
    'PanelElementController',
    function ($scope, $timeout) {

        $scope.el = $scope.element;

        $scope.focusArrived = function(el, index, panelIndex) {
            if (panelIndex > $scope.selectedPanelIndex) {
                // refuse to skip ahead of selectedPanelIndex, instead cycle to 0
                $scope.choose(0, $scope.selectedPanelIndex);
            }
            else {
                $scope.choose(index, panelIndex);
            }
        };

        $scope.navigationKeyPressed = function (key) {
            var elements = $scope.panels[$scope.selectedPanelIndex].element.elements;
            if (!elements) return;
            var size = elements.length;
            switch (key) {
                case 'up':
                    $scope.choose(($scope.choice + size - 1) % size, $scope.selectedPanelIndex);
                    break;
                case 'down':
                    $scope.choose(($scope.choice + 1) % size, $scope.selectedPanelIndex);
                    break;
                case 'right':
                    if ($scope.panels[$scope.selectedPanelIndex + 1].element.elements) {
                        $scope.choose(0, $scope.selectedPanelIndex + 1);
                    }
                    else {
                        $scope.setActiveEl($scope.el);
                    }
                    break;
                case 'left':
                    if ($scope.selectedPanelIndex > 0) {
                        $scope.choose($scope.panels[$scope.selectedPanelIndex - 1].selected, $scope.selectedPanelIndex - 1);
                    }
                    break;
                case 'enter':
                    if ($scope.el.elements) {
                        if ($scope.panels[$scope.selectedPanelIndex + 1].element.elements) {
                            $scope.choose(0, $scope.selectedPanelIndex + 1);
                        }
                        else {
                            $scope.setActiveEl($scope.el);
                        }
                    }
                    else {
                        $scope.setEditing(true);
                        $scope.setActiveEl($scope.el); // to grab focus
                    }
                    break;
                case 'escape':
                    $scope.setEditing(false);
                    if ($scope.el.elements) {
                        if ($scope.selectedPanelIndex > 0) {
                            $scope.choose($scope.panels[$scope.selectedPanelIndex - 1].selected, $scope.selectedPanelIndex - 1);
                        }
                    }
                    else {
                        $scope.setActiveEl($scope.el); // to grab focus
                    }
                    break;
            }
        };
    }
);
OSCR.directive('documentNavigation', function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attr, ctrl) {
            elem.bind('keydown', function (e) {
                _.each([
                    { code: 37, name: 'left'},
                    { code: 39, name: 'right'},
                    { code: 38, name: 'up'},
                    { code: 40, name: 'down'},
                    { code: 13, name: 'enter'},
                    { code: 27, name: 'escape'}
                ], function (pair) {
                    if (pair.code === e.keyCode) {
                        scope.$apply(function (s) {
                            $('body').addClass('keyboard-on');
                            s.$eval(attr.documentNavigation, { $key: pair.name });
                        });
                    }
                });
            });
        }
    };
});


// the controller for viewing the tree only, not editing.  separates media from non-media.
OSCR.controller('ViewTreeController', [ '$rootScope', '$scope', '$filter', 'PDFViewerService', '$timeout', function($rootScope, $scope, $filter, pdf, $timeout) {

    var pdfViewer;


    $scope.filterNonMedia = function(elementList) {
        return _.filter(elementList, function(element) {
            return !element.config.media;
        });
    };

    $scope.hasValue = function(el) {
        return hasContent(el);
    };

    function initializeViewStates(){
        $scope.showImage = false;
        $scope.showVideo = false;
        $scope.showAudio = false;
        $scope.showPdf = false;
        $scope.videoSrc = '';
        $scope.videoMime = '';
    }
    initializeViewStates();

    // TODO: crossbrowser video support. Only Safari works good
    // sets up the video player
    function intializeVideoPlayer(el) {
        $scope.videoSrc = $filter('mediaFile')(el);
        $scope.videoMime = $filter('mediaMimeType')(el);
    }

    $scope.$watch("tree", function(tree, oldTree) {
        // collect an array of only the media elements
        $scope.mediaElements = tree ? collectMediaElements(tree) : [];

        $scope.transportMedia = function () {
            return $scope.mediaElements;
        }
        // trigger media viewer after the mediaElements arrive
        $scope.$watch('mediaElements', function(mediaElements, oldMediaElements){
            // set the intital element
            $scope.mediaElement = $scope.mediaElements[0];
            // what are we going to show first?
            var initialMime = $filter('mediaMimeType')($scope.mediaElement);
            switch(initialMime) {
                case 'image/jpeg':
                case 'image/jpg':
                    $scope.showImage = true;
                    break;
                case 'image/png':
                    $scope.showImage = true;
                    break;
                case 'image/gif':
                    $scope.showImage = true;
                    break;
                case 'video/mp4':
                    $scope.showVideo = true;
                    intializeVideoPlayer($scope.mediaElement);
                    break;
                case 'video/quicktime':
                    $scope.showVideo = true;
                    intializeVideoPlayer($scope.mediaElement);
                    break;
                case 'application/pdf':
                    $scope.showPdf = true;
                    showPdf($scope.mediaElement);
                    break;
            }

            // list of pdf files: note $scope.mediaFiles is inherited from the ViewTreeController
            // hence this controller must always be nested inside of that in the html
            $scope.pdfFiles = [];
            _.each($scope.mediaElements, function(file){
                if (file.value && $rootScope.isPdf(file)) {
                    $scope.pdfFiles.push(file);
                }
            });
            
            $scope.switchViewSource = function (el) {
                initializeViewStates();
                if($rootScope.isImage(el)){
                    $scope.showImage = true;
                    $('#image-viewer').attr('src', $filter('mediaFile')(el));
                }
                if($rootScope.isVideo(el)){
                    $scope.showVideo = true;
                    intializeVideoPlayer(el);
                }
                if($rootScope.isPdf(el)){
                    $scope.showPdf = true;
                    showPdf(el);
                }
            }
        });
    });

    function showPdf(el){
//        $scope.pdfURL = "";
        // Set the path for the pdf to get using the mediaFile filter
        $scope.pdfURL = $filter('mediaFile')(el);

        $scope.setPdfPath = function (path) {
            $scope.pdfURL = path;
        };

        pdfViewer = pdf.Instance("pdf-viewer");

        $scope.nextPage = function() {
            pdfViewer.nextPage();
        };

        $scope.prevPage = function() {
            pdfViewer.prevPage();
        };

        $scope.gotoPage = function(page) {
            pdfViewer.gotoPage(page);
        };

        $scope.pageLoaded = function(curPage, totalPages) {
            $scope.currentPage = curPage;
            $scope.totalPages = totalPages;
        };

        $scope.loadProgress = function(loaded, total, state) {
            console.log('loaded =', loaded, 'total =', total, 'state =', state);
        };
    }

    // PDF viewing functionality: initialize only if there are pdf files
    $scope.$watch('pdfFiles', function(){
        // If there are no pdf's then abort this mission
        // && for now also abort if more than one
        // TODO: make this work for multiple pdf files
        if(!$scope.pdfFiles.length || ($scope.pdfFiles.length > 1)) return;

        $scope.pdfURL = "";
        // Set the path for the pdf to get using the mediaFile filter
        $scope.pdfURL = $filter('mediaFile')($scope.pdfFiles[0]);
        showPdf($scope.pdfFiles[0]);
    });
}]);



OSCR.controller(
    'ViewElementController',
    function ($scope) {

        $scope.getViewTemplate = function (el) {
            if (el.elements) return "view-submenu.html";
            if (el.config.line) return "view-line.html";
            if (el.config.paragraph) return "view-paragraph.html";
            if (el.config.vocabulary) return "view-vocabulary.html";
            if (el.config.media) return "view-media.html";
            if (el.config.instance) return "view-instance.html";
            return "view-unrecognized.html"
        };
    }
);

// the controller for the expert editing of the whole tree in view
OSCR.controller(
    'ExpertTreeController',
    function ($rootScope, $scope) {

        $scope.activeEl = null;

        $scope.setActiveEl = function (el) {
            if ($scope.activeEl === el) return;
            if ($scope.activeEl) {
                console.log('no longer editing', $scope.activeEl.name);
                $scope.activeEl.editing = false;
            }
            if ($scope.activeEl = el) {
                console.log('starting to edit', el.name);
                $scope.setEditing(el.editing = true);
            }
        };

        $scope.isActiveEl = function (el) {
            return $scope.activeEl === el;
        };

        $scope.isEditing = function(el) {
            return $scope.isActiveEl(el) && $scope.editing;
        };

        $scope.valueChanged = function (el) {
            var active = el == $scope.activeEl;
            if (active) {
                $scope.validateTree();
            }
        };
    }
);

OSCR.controller(
    'ExpertSubtreeController',
    function ($scope) {
        $scope.setParentEl = function(parentEl) {
            $scope.parentEl = parentEl;
        };
    }
);

OSCR.controller(
    'ExpertElementController',
    function ($scope) {

        $scope.addSibling = function (el) {
            $scope.addSiblingToParent($scope.parentEl, $scope.elIndex);
        };

        $scope.removeSibling = function (el) {
            $scope.removeSiblingFromParent($scope.parentEl, $scope.elIndex);
        };

        $scope.getExpertEditTemplate = function (el) {
            if (el.elements) return "expert-submenu.html";
            if (el.config.line) return "expert-line.html";
            if (el.config.paragraph) return "expert-paragraph.html";
            if (el.config.vocabulary) return "expert-vocabulary.html";
            if (el.config.media) return "expert-media.html";
            if (el.config.instance) return "expert-instance.html";
            return "expert-unrecognized.html"
        };

        $scope.getDetailTemplate = function (el) { // todo: shouldn't be necessary
            if (el && el.config.media) {
                return "expert-media-search.html"; // todo: adopt it into expert-media.html
            }
            return "expert-unrecognized.html"
        };
    }
);

OSCR.directive('elFocus',
    function () {
        return {
            restrict: 'A',
            priority: 100,
            link: function ($scope, $element) {
                // add this element to the focus element array and tell it which one it is
                $scope.el.focusElementIndex = $scope.focusElementArray.length;
                $scope.focusElementArray.push($element[0]);
            }
        };
    }
);

OSCR.directive('elHiddenFocus',
    function () {
        return {
            restrict: 'A',
            priority: 100,
            link: function ($scope, $element) {
                // add this element to the focus element array and tell it which one it is
                $scope.el.hiddenFocusElementIndex = $scope.hiddenFocusElementArray.length;
                $scope.hiddenFocusElementArray.push($element[0]);
            }
        };
    }
);

OSCR.directive('videoPlayer',
    function () {
        return {
            restrict: 'A',
            link: function($scope, element, attrs){
                var src = attrs.src;
                var type = attrs.type;
                var id = attrs.id;
                console.log('src', src);
            }
        };
    }
);

OSCR.directive('uiVideo', function () {
    var vp; // video player object to overcome one of the angularjs issues in #1352 (https://github.com/angular/angular.js/issues/1352). when the videojs player is removed from the dom, the player object is not destroyed and can't be reused.
    var videoId = Math.floor((Math.random() * 1000) + 100); // in random we trust. you can use a hash of the video uri
    return {
        template: '<div class="video-player">' +
            '<video ng-src="{{ videoSrc }}" id="video-' + videoId + '" class="video-js vjs-default-skin" controls preload="auto">' +
            'Your browser does not support the video tag. ' +
            '</video></div>',
        link: function (scope, element, attrs) {
//            if (vp) vp.dispose();
            scope.$on('$destroy', function () {
                vp.dispose();
            });
            vp = videojs('video-' + videoId, {"width": '100%', "height": 400 });
        }
    };
});

