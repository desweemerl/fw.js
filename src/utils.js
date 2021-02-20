/**
 * @module fw/utils
 * @license MIT License
 * @author Ludovic Desweemer
 */
'use strict';

var initialized = false;

var utils = {
    /**
     * Extend an object
     * @function extendObject
     * @param {boolean} [recursive] - extends recursively objects
     * @param {...Object} object - object(s) to be extended
     * @return {Object}
     */
    extendObject: function() {
        var l = arguments.length;
        var n = 1;
        var recursive = false;
        var object;

        function extendObj(objDest, objSrc) {
            var value, key, valueIsObject, valueIsFunction;

            for (key in objSrc) {
                value = objSrc[key];

                if (recursive) {
                    valueIsObject = false;

                    if (value !== null && typeof value === 'object' && !(value instanceof Array)) {
                        valueIsObject = true;

                        if (objDest[key] === undefined) {
                            objDest[key] = {};
                        }

                        extendObj(objDest[key], value);
                    }

                    if (!valueIsObject) {
                        objDest[key] = value;
                    }
                } else {
                    objDest[key] = value;
                }
            }
        }

        if (typeof arguments[0] === 'boolean') {
            recursive = arguments[0];
            object = arguments[1];
            n++;
        } else {
            object = arguments[0];
        }

        if (object === null || object === undefined) {
            object = {};
        }

        for (; n < l; n++) {
            extendObj(object, arguments[n]);
        }

        return object;
    },
    /**
     * Duplicate an array
     * @function copyArray
     * @param {Array} source - source array to be duplicated
     * @return {Array}
     */
    copyArray: function(source) {
        var destination = [];
        var n, l, value, target;

        if (source instanceof Array) {
            for (n = 0, l = source.length; n < l; n++) {
                value = source[n];
                target = undefined;

                if (value !== null && typeof value === 'object' && !(value instanceof Array)) {
                    target = this.copyObject(value);
                }

                if (target === undefined) {
                    target = value;
                }

                destination.push(target);
            }
        }

        return destination;
    },
    /**
     * Duplicate an object
     * @function copyObject
     * @param {...Object} object - object(s) to be duplicated
     * @return {Object}
     */
    copyObject: function() {
        var target = {};
        var n, l;

        function copyObj(destination, source, index) {

            var key, value, i, j, modified;
            // Check if we duplicate an element inside an array (source)
            if (index !== undefined) {
                value = source[index];
                // Duplicate array inside an array
                if (value instanceof Array) {
                    destination[index] = [];

                    for (i = 0, j = value.length; i < j; i++) {
                        copyObj(destination[index], value, i);
                    }
                } else if (value !== undefined) {
                    // Duplicate object inside an array
                    if (value !== null && typeof value === 'object') {
                        if (destination[index] === undefined) {
                            destination[index] = {};
                        }

                        copyObj(destination[index], value);

                        return;
                    }

                    destination[index] = value;
                }
            } else if (source !== null && typeof source === 'object' && !(source instanceof Array)) {
                for (key in source) {
                    value = source[key];
                    // Duplicate all elements inside an array
                    if (value instanceof Array) {
                        destination[key] = [];

                        for (i = 0, j = value.length; i < j; i++) {
                            copyObj(destination[key], value, i);
                        }
                    } else if (value !== undefined) {
                        modified = false;

                       // Duplicate all element inside an object
                        if (value !== null && typeof value === 'object') {
                            if (destination[key] === undefined) {
                                destination[key] = {};
                            }

                            copyObj(destination[key], value);
                            modified = true;
                        }

                        if (!modified) {
                            destination[key] = value;
                        }
                    }
                }
            }
            // Copy the value if the source is neither an object nor an array
            else {
                destination = source;
            }
        }

        for (n = 0, l = arguments.length; n < l; n++) {
            copyObj(target, arguments[n]);
        }

        return target;
    },
    /**
     * Set value to a property of an object. Create the property if it doesn't exits.
     * @function setValueToObject
     * @param {Object} object - object to be updated
     * @param {string} property - property modified
     * @param {*} value - value assigned to the object property
     */
    setValueToObject: function(object, property, value) {
        if (object === null || typeof object !== 'object') return;

        var propertyArray = property.split('.');
        var n, l, prop;

        for (n = 0, l = propertyArray.length - 1; n < l; n++) {
            prop = propertyArray[n];

            if (object[prop] === null || typeof object[prop] !== 'object') {
                object[prop] = {};
            }

            object = object[prop];
        }

        object[propertyArray[l]] = value;
    },
    /**
     * Get property value of an object
     * @function getValueFromObject
     * @param {Object} object - object from which we read the property
     * @param {string} property - object property
     * @return {*}
     */
    getValueFromObject: function(object, property) {
        if (object === null || typeof object !== 'object') return;

        var propertyArray = property.split('.');
        var n, l, prop;

        for (n = 0, l = propertyArray.length - 1; n < l; n++) {
            prop = propertyArray[n];
            if (object[prop] === null || typeof object[prop] !== 'object') return;
            object = object[prop];
        }

        return object[propertyArray[l]];
    }
};

module.exports = utils;
