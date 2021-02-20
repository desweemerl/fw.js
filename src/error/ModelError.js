/**
 * @module fw/error/ModelError
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var types = require('../types');

/**
 * Create an model based error
 * @class
 * @alias module:fw/error/ElementError
 * @augments Error
 * @param {Object} error - error to be thrown
 * @param {string} [error.message] - error message
 * @param {string} [error.origin} - error origin
 * @param {string} [error.modelName] - element name* 
 */
class ModelError extends Error {
    /**
     * @constructor
     */
    constructor(error) {
        super();

        if (types.isObject(error)) {
            if (types.isString(error.modelName)) { this.modelName = error.modelName; }
            if (types.isString(error.message))   { this.message = error.message; }
            if (types.isString(error.origin))    { this.origin = error.origin; }
        }
    }
}

module.exports = ModelError;
