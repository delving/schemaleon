'use strict';

angular.module('OSCR').service("Validator",
    function () {
        this.getFunction = function (name) {
            switch (name) {
                case 'date' :
                    break;
                case 'pixels' :
                    return function (value) {
                        if (value && !value.match(/^[0-9]+[Xx][0-9]+$/)) {
                            return 'Value should be WIDTHxHEIGHT, like 640x480';
                        }
                        return null;
                    };
            }
            return null;
        };
    }
);
