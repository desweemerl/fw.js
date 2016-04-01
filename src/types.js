/**
 * @module fw/types
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */
'use strict';

var types = {
    /**
     * Check if variable is neither null nor undefined
     * @function isNotNull
     * @param {*} variable - variable processed
     * @return {boolean}
     */
    isNotNull: function(variable) {
        return variable !== undefined && variable !== null;
    },
    /**
     * Check if variable is an instance of an object
     * @function isObject
     * @param {*} variable - variable processed
     * @return {boolean}
     */
    isObject: function(variable) {
        return variable !== null && typeof variable === 'object'; 
    },
    /**
     * Check if variable is a string
     * @function isString
     * @param {*} variable - variable processed
     * @return {boolean}
     */
    isString: function(variable) {
        return typeof variable === 'string';
    },
    /**
     * Check if variable is an empty string
     * @function isEmptyString
     * @param {*} variable - variable processed
     * @return {boolean}
     */
    isEmptyString: function(variable) {
        return typeof variable === 'string' ? variable.trim().length === 0 : true;
    },
    /**
     * Check if variable is a function
     * @function isFunction
     * @param {*} variable - variable processed
     * @return {boolean}
     */
    isFunction: function(variable) {
        return typeof variable === 'function';
    },
    /**
     * Check if variable is boolean
     * @function isBoolean
     * @param {*} variable - variable processed
     * @return {boolean}
     */
    isBoolean: function(variable) {
        return typeof variable === 'boolean';
    },
    /**
     * Check if variable is a number (can be NaN and infinite)
     * @function isNumber
     * @param {*} variable - variable processed
     * @return {boolean}
     */
    isNumber: function(variable) {
        return typeof variable === 'number';
    },
    /**
     * Check if variable is a valid number (can't be NaN and infinite)
     * @function isValidNumber
     * @param {*} variable - variable processed
     * @return {boolean}
     */
    isValidNumber: function(variable) {
        if (typeof variable === 'number') {
            return !isNaN(variable) && isFinite(variable);
        }

        return false;
    },
    /**
     * Check if variable is an array
     * @function isArray
     * @param {*} variable - variable processed
     * @return {boolean}
     */
    isArray: function(variable) {
        return variable instanceof Array;
    },
    /**
     * Check if variable is undefined
     * @function isUndefined
     * @param {*} variable - variable processed
     * @return {boolean}
     */
    isUndefined: function(variable) {
        return typeof variable === 'undefined';
    },
    /**
     * Check if an element is in a specified array
     * @method inArray
     * @param {*} element
     * @param {Array} array
     * @return {boolean}
     */
    inArray: function(element, array) {
        return array instanceof Array ? array.indexOf(element) !== -1 : false;
    },
    /**
     * Check if an object is empty
     * @function isEmptyObject
     * @param {Object} object - object to be check
     * @return {boolean}
     */
    isEmptyObject: function(object) {
        if (object === null || object === undefined) return true;

        var key;        

        for (key in object) return false;
        return true;
    },
};

module.exports = types;
