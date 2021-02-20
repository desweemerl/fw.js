/**
 * @module fw/error/ElementError
 * @license MIT License
 * @author Ludovic Desweemer
 */
'use strict';

var types = require('../types');

/**
 * Create an element based error
 * @class
 * @alias module:fw/error/ElementError
 * @augments Error
 * @param {Object} error - error to be thrown
 * @param {string} [error.message] - error message
 * @param {string} [error.origin} - error origin
 * @param {string} [error.elementName] - element name
 */
class ElementError extends Error {
    /**
     * @constructor 
     */   
    constructor(error) {
        super();

        if (types.isObject((error))) {
            if (types.isString(error.elementName)) { this.elementName = error.elementName; }
            if (types.isString(error.message))     { this.message = error.message; }
            if (types.isString(error.origin))      { this.origin = error.origin; }
        }
    }
}

module.exports = ElementError;
