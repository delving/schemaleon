'use strict';

angular.module('OSCR').service(
    "Validator",
    function () {
        this.getFunction = function (name) {
            switch (name) {
                case 'required':
                    return function(value) {
                        return value ? null: '2:Required'
                    };
                case 'date' :
                    break;
                case 'pixels' :
                    return function (value) {
                        if (value && !value.match(/^[0-9]+[Xx][0-9]+$/)) {
                            return 'MustBeWidthTimesHeight';
                        }
                        return null;
                    };
            }
            return null;
        };
    }
);
