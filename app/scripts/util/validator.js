/*
 Copyright 2014 Delving BV, Rotterdam, Netherlands

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

/**
 * Validation of fields (still needs a lot of work)
 *
 * @Author Gerald de Jong <gerald@delving.eu>
 * @Author Eric van der Meulen <eric@delving.eu>
 */

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
        case 'date':
            //todo
            break;
        case 'integer':
            //todo
            break;
        case 'URL':
            break;
        case 'URI':
            break;
        case 'ISBN':
            break;
        case 'longitude':
            break;
        case 'latitude':
            break;
        case 'emailAddress':
            break;
        case 'telephoneNumber':
            break;
        case 'timePrimitive':
            break;
        default:
            console.log('No validator found for: ' + name);
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
//            else {
//                console.log('no validators ' + el.name);
//            }
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



