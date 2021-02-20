/**
 * @module fw/validator/CheckValidator
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var i18nValidation = require('../nls/validation');
var Message = require('../i18n/Message');
var types = require('../types');
var Validator = require('./Validator');

/**
 * Create a check validator
 * @class
 * @alias module:/fw/validator/CheckValidator
 * @param {Object} [config] - the configuration object parameter
 * @param {function} config.check - check function validator
 * @param {string} [config.message] - error message when the check function validator return false
 */
class CheckValidator extends Validator {
    /**
     * get validator from an instance or a configuration object
     * @method getValidator
     * @static
     * @param {Object} object - the configuration object parameter
     * @return {fw/ui/Validator}
     */
    static getValidator(object) {
        object = object || {};

        if (object.checkValidator instanceof CheckValidator) {
            return object.checkValidator; 
        } else if (types.isFunction(object.check)) {
            return new CheckValidator({
                check: object.check
            });
        }

        return null;
    }
    /**
     * @constructor
     */
    constructor(config) {
        super();

        this.check = config.check;
        this.i18n = config.i18n || null;
        this.message = config.message || 'validator.invalid';
        this.args = config.args || null;
    }
    /**
     * Validate a value
     * @method validate
     * @param {*} value - value to be validate
     * @param {Object} [context = this] - context for the check function
     * @return {Object} output messages
     */
    validate(value, context) {
        context = context || this;

        var output = { check: null };
        var valid = types.isFunction(this.check) ? this.check.call(context, value) : true;

        if (!valid) {
            output.check = new Message({
                i18n:    this.i18n ? [i18nValidation, this.i18n] : i18nValidation,
                message: this.message,
                args:    this.args
            });
        }

        return output;
    }
}

module.exports = CheckValidator;
