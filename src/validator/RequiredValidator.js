/**
 * @module fw/validator/RequiredValidator
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var FwCurrency = require('../type/Currency');
var FwDate = require('../type/Date');
var FwInteger = require('../type/Integer');
var FwNumber = require('../type/Number');
var FwTime = require('../type/Time');
var FwTimestamp = require('../type/Timestamp');
var i18nValidation = require('../nls/validation');
var Message = require('../i18n/Message');
var types = require('../types');
var Validator = require('./Validator');

/**
 * Create a required validator
 * @class
 * @alias module:/fw/validator/RequiredValidator
 * @param {Object} [config] - the configuration object parameter
 * @param {boolean|function} config.required - required validator
 * @param {string} [config.message] - error message for the required validator
 */
class RequiredValidator extends Validator {
    /**
     * get validator from an instance or a configuration object
     * @method getValidator
     * @static
     * @param {Object} object - the configuration object parameter
     * @return {fw/ui/Validator}
     */
    static getValidator(object) {
        object = object || {};

        if (object.requiredValidator instanceof RequiredValidator) {
            return object.requiredValidator;
        } else if (object.required === true || types.isFunction(object.required)) {
            return new RequiredValidator({
                required: object.required
            });
        }

        return null;
    }
    /**
     * @constructor
     */
    constructor(config) {
        super();

        config = config || {};

        this.required = config.required === undefined ? true : config.required;
        this.i18n = config.i18n || null;
        this.message = config.message || 'validator.required';
    }
    /**
     * validate a value
     * @method validate
     * @param {*} value
     * @param {Object} [context = this] - context for the required function
     * @returns {Object} output messages
     */
    validate(value, context) {
        context = context || this;

        var output = { required: null };
        var isNull = false;
        var required = types.isFunction(this.required) ? this.required.call(context, value) : this.required;

        if (required) {
            if (value === null || value === undefined) {
                isNull = true;
            } else if (value instanceof FwCurrency || value instanceof FwNumber || value instanceof FwInteger || value instanceof FwDate || value instanceof FwTime || value instanceof FwTimestamp) {
                isNull = value.isNull();
            }

            if (isNull) {
                output.required = new Message({
                    i18n:    this.i18n ? [i18nValidation, this.i18n] : i18nValidation,
                    message: this.message
                });
            }
        }

        return output;
    }
}

module.exports = RequiredValidator;
