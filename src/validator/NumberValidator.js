/**
 * @module fw/validator/NumberValidator
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var FwCurrency = require('../type/Currency');
var FwInteger = require('../type/Integer');
var FwNumber = require('../type/Number');
var i18nValidation = require('../nls/validation');
var Message = require('../i18n/Message');
var types = require('../types');
var Validator = require('./Validator');

function getValue(param) {
    if (types.isNotNull(param)) {
        if (types.isValidNumber(param)) {
            return param;
        } else if (types.isFunction(param.getCurrency)) {
            return param.getCurrency();
        } else if (types.isFunction(param.getNumber)) {
            return param.getNumber();
        } else if (types.isFunction(param.getInteger)) {
            return param.getInteger();
        }
    }

    return null;
}

/**
 * Create a number validator
 * @class
 * @alias module:/fw/validator/NumberValdiator
 * @param {Object} [config] - the configuration object parameter
 * @param {number|function|fw/type/Currency|fw/type/Integer|fw/type/Number} config.minValue - minValue validator
 * @param {string} [config.message.minValue] - error message for the minValue validator
 * @param {number|function|fw/type/Currency|fw/type/Integer|fw/type/Number} config.maxValue - maxValue validator
 * @param {string} [config.message.maxValue] - error message for the maxValue validator
 * @param {booolean|function} config.positive - positive validator
 * @param {string} [config.message.positive] - error message for the positive validator
 */
class NumberValidator extends Validator {
    /**
     * get validator from an instance or a configuration object
     * @method getValidator
     * @static
     * @param {Object} object - the configuration object parameter
     * @return {fw/ui/Validator}
     */
    static getValidator(object) {
        object = object || {};

        if (object.numberValidator instanceof NumberValidator) {
            return object.numberValidator;
        } else if (
            types.isValidNumber(object.minValue) || 
            types.isFunction(object.minValue) || 
            object.minValue instanceof FwNumber || 
            object.minValue instanceof FwCurrency ||
            object.minValue instanceof FwInteger ||
            types.isValidNumber(object.maxValue) || 
            types.isFunction(object.maxValue) || 
            object.maxValue instanceof FwNumber ||
            object.maxValue instanceof FwCurrency || 
            object.maxValue instanceof FwInteger ||
            types.isFunction(object.positive) ||
            object.positive === true) {

            return new NumberValidator({
                minValue: object.minValue,
                maxValue: object.maxValue,
                positive: object.positive
            });
        }

        return null;
    }
    /**
     * Get target types
     * @property type
     */
    static get types() {
        return ['number', FwCurrency, FwNumber, FwInteger];
    }
    /**
     * @constructor
     */
    constructor(config) {
        config = config || {};
        config.messages = config.messages || {};

        this.minValue = config.minValue;
        this.maxValue = config.maxValue;
        this.positive = !!config.positive;
        this.i18n = config.i18n || null;

        this.messages = {
            minValue: config.messages.minValue || 'validator.minValue',
            maxValue: config.messages.maxValue || 'validator.maxValue',
            positive: config.messages.positive || 'validator.positive'
        };
    }
    /**
     * validate a value
     * @method validate
     * @param {number|fw/type/Currency|fw/type/Integer|fw/type/Number} value
     * @param {Object} [context = this] - context for the maxValue, minValue and positive function
     * @return {Object} output messages
     */
    validate(value, context) {
        context = context || this;

        var output = {
            minValue: null,
            maxValue: null,
            positive: null
        };
        var maxValue = types.isFunction(this.maxValue) ? this.maxValue.call(context, value) : this.maxValue;
        var minValue = types.isFunction(this.minValue) ? this.minValue.call(context, value) : this.minValue;
        var positive = types.isFunction(this.positive) ? this.positive.call(context, value) : this.positive;
        var checkValue = getValue(value);

        if (types.isValidNumber(checkValue)) {
            if (positive) {
                if (checkValue < 0) {
                    output.positive = new Message({
                        i18n:    this.i18n ? [i18nValidation, this.i18n] : i18nValidation,
                        message: this.messages.positive
                    });
                }
            }

            minValue = getValue(minValue);

            if (types.isValidNumber(minValue)) {
                if (checkValue < minValue) {
                    output.minValue = new Message({
                        i18n:    this.i18n ? [i18nValidation, this.i18n] : i18nValidation,
                        message: this.messages.minValue,
                        args:    { minValue: minValue }
                    });
                }
            }

            maxValue = getValue(maxValue);

            if (types.isValidNumber(maxValue)) {
                if (checkValue > maxValue) {
                    output.maxValue = new Message({
                        i18n:    this.i18n ? [i18nValidation, this.i18n] : i18nValidation,
                        message: this.messages.maxValue,
                        args:    { maxValue: maxValue }
                    });
                }
            }
        }

        return output;
    }
}

module.exports = NumberValidator;
