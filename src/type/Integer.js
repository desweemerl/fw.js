/**
 * @module fw/type/Integer
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var types = require('../types');
var utils = require('../utils');

var integerInputRegExp = /^-?\d*$/;
var positiveIntegerInputRegExp = /^\d*$/;
var integerRegExp = /^-?\d+$/;

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


    return 0;
}

/**
 * Create an integer
 * @class
 * @alias module:fw/type/Integer
 * @param {string|number|fw/type/Integer} - create an integer from a valid input
 */
class FwInteger {
    /**
     * @constructor
     */
    constructor(number) {
        this.setInteger(number);
    }
    /**
     * Set the integer
     * @method setInteger
     * @param {string|number|fw/type/Integer} - set the integer from a valid input
     */
    setInteger(number) {
        var numToExp;

        if (number instanceof FwInteger) {
            this.value = utils.copyArray(number.value);
            return this.value;
        } else if (types.isString(number)) {
            if (number.trim().length > 0) {
                number = Number(number);
            }
        }

        if (types.isValidNumber(number)) {
            number = Math.floor(number);
            numToExp = number.toExponential().split('e');
        }

        if (numToExp !== undefined) {
            this.value = [parseFloat(numToExp[0], 10), parseFloat(numToExp[1], 10)];
            return;
        }

        this.value = null;
    }
    /**
     * Get the mantissa part of the integer
     * @method getMantissa
     * @return {number}
     */
    getMantissa() {
        return this.value === null ? null : this.value[0];
    }
    /**
     * Get the exponent part of the integer
     * @method getExponent
     * @return {number}
     */
    getExponent() {
        return this.value === null ? null : this.value[1];
    }
    /**
     * Get the integer
     * @method getInteger
     * @return
     */
    getInteger() {
        return this.value === null ? null : this.value[0] * Math.pow(10, this.value[1]);
    }
    /**
     * Check equality of integers
     * @method equals
     * @param {fw/type/Integer} integer - integer to be checked
     * @return {boolean}
     */
    equals(integer) {
        return integer instanceof FwInteger ? this.getInteger() === integer.getInteger() : false;
    }
    /**
     * Add integers
     * @method add
     * @param {...fw/type/Currency|...fw/type/Number|...fw/type/Integer} integers - integers to be added
     * @return {fw/type/Integer}
     */
    add() {
        var result = this.getInteger();
        var n, l;

        for (n = 0, l = arguments.length; n < l; n++) {
            result += getValue(arguments[n]);
        }

        return new FwInteger(result);
    }
    /**
     * Substract integers
     * @method substract
     * @param {...fw/type/Currency|...fw/type/Number|...fw/type/Integer} integers - integers that substracts
     * @return {fw/type/Integer}
     */
    substract() {
        var result = this.getInteger();
        var n, l;

        for (n = 0, l = arguments.length; n < l; n++) {
            result -= getValue(arguments[n]);
        }

        return new FwInteger(result);
    }
    /**
     * Multiply integers
     * @method multiply
     * @param {...fw/type/Currency|...fw/type/Number|...fw/type/Integer} integers - integers to be multiplied
     * @return {fw/type/Integer}
     */
    multiply() {
        var result = this.getInteger();
        var n, l;

        for (n = 0, l = arguments.length; n < l; n++) {
            result *= getValue(arguments[n]);
        }

        return new FwInteger(result);
    }
    /**
     * Divide integers
     * @method divide
     * @param {...fw/type/Currency|...fw/type/Number|...fw/type/Integer} integers - integers that divides
     * @return {fw/type/Integer}
     */
    divide() {
        var result = this.getInteger();
        var n, l;

        for (n = 0, l = arguments.length; n < l; n++) {
            result /= getValue(arguments[n]);
        }

        return new FwInteger(result);
    }
    /**
     * Check if the integer is null
     * @method isNull
     * @return {boolean}
     */
    isNull() {
        return this.value === null;
    }
    /**
     * Output the integer as a string
     * @method toString
     * @param {Object} [options] - output options
     * @param {number} [options.precision] - output precision
     * @param {number} [options.decimals] - output decimals
     * @return {string}
     */
    toString(options) {
        options = options || {};

        var precision = options.precision || 5;
        var pow, value;

        if (this.value === null) return '';
        pow = Math.pow(10, precision);

        if (this.value[1] > 8 || this.value[1] < -6) {
            return options.decimals ?
                String((Math.round(this.value[0] * pow) / pow).toFixed(options.decimals)) + 'e' + String(this.value[1]) :
                    String((Math.round(this.value[0] * pow) / pow)) + 'e' + String(this.value[1]);
        }

        return String((Math.round(this.getInteger() * pow) / pow));
    }
    /**
     * Output the integer as a json value
     * @method toJSON
     * @return {number}
     */
    toJSON () {
        return this.getInteger();
    }
    /**
     * Check if the string is an integer format
     * @method isInteger
     * @static
     * @param {string} integer
     * @return {boolean}
     */
    static isInteger(integer) {
        if (!types.isString(integer)) return false;
        integer = integer.trim();
        if (integer.length === 0) return true;

        return integerRegExp.test(integer);
    }
    /**
     * Check an input value for number testing. This function is called from UI element.
     * @method checkInput
     * @static
     * @param {string} input - the UI element input value
     * @param {Object} [options] - checkInput options
     * @param {boolean} [options.positive] - add a postive criteria to the check
     * @return {boolean}
     */
    static checkInput(input, options) {
        options = options || {};
        if (!types.isString(input)) return false;
        if (input.length === 0) return true;

        return options.positive ? positiveIntegerInputRegExp.test(input) : integerInputRegExp.test(input);
    }
}

module.exports = FwInteger;
