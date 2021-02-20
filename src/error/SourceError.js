/**
 * @module fw/error/SourceError
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var types = require('../types');

/**
 * Create an source based error
 * @class
 * @alias module:fw/error/SourceError
 * @augments Error
 * @param {Object} error - error to be thrown
 * @param {string} [error.message] - error message
 * @param {string} [error.origin} - error origin
 * @param {string} [error.sourceName] - source name
 */
class SourceError extends Error {
    /**
     * @constructor
     */
    constructor(error) {
        super();
        
        if (types.isObject(error)) {
            if (types.isString(error.sourceName)) { this.sourceName = error.sourceName; }
            if (types.isString(error.message))    { this.message = error.message; }
            if (types.isString(error.origin))     { this.origin = error.origin; }
            if (types.isString(error.element))    { this.element = error.element; }
        }
    }
}

module.exports = SourceError;
