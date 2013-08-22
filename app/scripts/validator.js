'use strict';

function installInElement(el, name) {
    var v = el.validators;
    switch (name) {
        case 'present':
            v.push(function (element) {
//                todo: when we figure out how to check for incompleteness
//                if (_.isObject(element.value)) {
//                    var incomplete = false;
//                    _.each(element.elements, function(subElement) {
//                        if (element.config.multiple) {
//                            console.log(element);
//                            console.log('does multiple '+element.name+" have subElement "+subElement.name+"?");
//                        }
//                        else {
//                            console.log(element);
//                            console.log('does '+element.name+" have subElement "+subElement.name+"?");
//                        }
//                        if (!element.value[subElement.name]) {
//                            incomplete = true;
//                            console.log('answer is no')
//                        }
//                    });
//                    if (incomplete) {
//                        return "2:";
//                    }
//                }
                return element.value ? '1:' : null;
            });
            break;
        case 'required':
            v.push(function (element) {
                return element.value ? null : '2:Required'
            });
            break;
        case 'pixels':
            v.push(function (element) {
                if (element.value && !element.value.match(/^[0-9]+[Xx][0-9]+$/)) {
                    return '3:MustBeWidthTimesHeight';
                }
                return null;
            });
            break;
        default:
            console.error('No validator found for: ' + name);
    }
}

function installValidators(tree) {
    function recurse(el) {
        el.validators = [];
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
        installInElement(el, 'present');
    }

    recurse(tree);
}

function validateTree(tree) {

    function validateNode(el) {
        if (el.dirty) {
            el.invalid = 0;
            if (el.elements) {
                _.each(el.elements, function (element) {
                    validateNode(element);
                });
                el.value = treeToObject(el);
                el.valueVisible = false;
            }
            else {
                el.valueVisible = !!el.value;
            }
            if (el.validators) {
                delete el.invalidMessage;
                _.each(el.validators, function (validate) {
                    if (el.invalid) return;
                    var message = validate(el);
                    if (message) {
                        var colon = message.indexOf(':');
                        if (colon > 0) {
                            el.invalid = parseInt(message.substring(0, colon));
                            if (colon == message.length - 1) {
                                return;
                            }
                            message = message.substring(colon + 1);
                        }
                        else {
                            el.invalid = 3;
                        }
                        el.invalidMessage = message;
                    }
                });
            }
            else {
                console.log('no validators ' + el.name);
            }
            delete el.dirty;
        }
        return el.invalid;
    }

    function setDirty(el) {
        _.each(el.elements, function (element) {
            setDirty(element);
        });
        el.dirty = true;
    }

    if (tree) {
        if (!tree.dirty) {
            setDirty(tree);
        }
        validateNode(tree);
    }
}



