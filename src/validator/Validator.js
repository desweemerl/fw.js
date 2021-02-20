/**
 * @module fw/validator/CheckValidator
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var ModuleError = require('../error/ModuleError');

/**
 * @interface
 * @alias module:/fw/validator/Validator 
 */
class Validator {
    /**
     * Validate a value
     * @method validate
     * @param {*} value - value to be validate
     * @param {Object} [context = this] - context for the check function
     * @return {Object} output messages
     */
    validate(value) {
        throw new ModuleError({
            moduleName: this.constructor.name,
            message:    '"validate" method must be implemented' 
        }); 
    }
}

module.exports = Validator;
