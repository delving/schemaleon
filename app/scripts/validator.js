'use strict';

function installInElement(el, name) {
    if (!el.validators) {
        el.validators = [];
    }
    var v = el.validators;
    switch (name) {
        case 'required':
            v.push(function(value) {
                return value ? null: '2:Required'
            });
            break;
        case 'pixels':
            v.push(function(value) {
                if (value && !value.match(/^[0-9]+[Xx][0-9]+$/)) {
                    return '3:MustBeWidthTimesHeight';
                }
                return null;
            });
            break;
        default:
            console.error('No validator found for: '+name);
    }
}

function installValidators(tree) {
    function recurse(el) {
        if (el.elements) {
            _.each(el.elements, function (element) {
                recurse(element);
            });
        }
        else {
            if (el.config.required) {
                installInElement(el, 'required');
            }
            if (el.config.validator) {
                installInElement(el, el.config.validator);
            }
        }
    }

    recurse(tree);
}

function validateTree(tree) {
    function validateNode(el) {
        if (el.dirty) {
            if (el.elements) {
                var maxInvalid = 0;
                _.each(el.elements, function (element) {
                    var invalid = validateNode(element);
                    if (invalid > maxInvalid) {
                        maxInvalid = invalid;
                    }
                });
                el.invalid = maxInvalid;
            }
            else {
                el.invalid = 0;
                if (el.validators) {
                    _.each(el.validators, function(validate) {
                        if (el.invalid) return;
                        var message = validate(el.value);
                        if (message) {
                            var colon = message.indexOf(':');
                            if (colon > 0) {
                                el.invalid = parseInt(message.substring(0, colon));
                                message = message.substring(colon + 1);
                            }
                            else {
                                el.invalid = 1;
                            }
                            el.invalidMessage = message;
                        }
                    });
                }
            }
            delete el.dirty;
        }
        return el.invalid;
    }

    function setDirty(el) {
        if (el.elements) {
            _.each(el.elements, function (element) {
                setDirty(element);
            });
        }
        else {
            el.dirty = true;
        }
    }

    if (!tree.dirty) {
        setDirty(tree);
    }
    validateNode(tree);
}



