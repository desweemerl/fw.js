/**
 * @module fw/error/ModelError
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var types = require('../types');

/**
 * Create an module based error
 * @class
 * @alias module:fw/error/ElementError
 * @augments Error
 * @param {Object} error - error to be thrown
 * @param {string} [error.message] - error message
 * @param {string} [error.origin} - error origin
 * @param {string} [error.elementName=Element] - element name
 */
class ModuleError extends Error {
    /**
     * @constructor
     */
    constructor(error) {
        if (types.isObject(error)) {
            if (types.isString(error.moduleName)) { this.moduleName = error.moduleName; }
            if (types.isString(error.message))    { this.message = error.message; }
            if (types.isString(error.origin))     { this.origin = error.origin; }
        }
    }
}

module.exports = ModuleError;
