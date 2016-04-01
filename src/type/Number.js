/**
 * @module fw/type/Number
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var types = require('../types');
var utils = require('../utils');

var numberInputRegExp = /^-?\d*(\.\d*)?$/;
var positiveNumberInputRegExp = /^\d*(\.\d*)?$/;
var numberRegExp = /^-?\d*(\.\d*)?$/;

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
 * Create a number
 * @class
 * @alias module:fw/type/Number
 * @param {string|number|fw/type/Number} - create a number from a valid input
 */
class FwNumber {
    /**
     * @constructor
     */
    constructor(number) {
        this.setNumber(number);
    }
    /**
     * Set the number
     * @method setNumber
     * @param {string|number|fw/type/Number} - set the number from a valid input
     */
    setNumber(number) {
        var numToExp;

        if (number instanceof FwNumber) {
            this.value = utils.copyArray(number.value);
            return this.value;
        } else if (types.isString(number)) {
            if (number.trim().length > 0) {
                number = Number(number);
            }
        }

        if (types.isValidNumber(number)) {
            numToExp = number.toExponential().split('e');
        }

        if (numToExp !== undefined) {
            this.value = [parseFloat(numToExp[0], 10), parseFloat(numToExp[1], 10)];
            return;
        }

        this.value = null;
    }
    /**
     * Get the mantissa part of the number
     * @method getMantissa
     * @return {number}
     */
    getMantissa() {
        return this.value === null ? null : this.value[0];
    }
    /**
     * Get the exponent part of the number
     * @method getExponent
     * @return {number}
     */
    getExponent() {
        return this.value === null ? null : this.value[1];
    }
    /**
     * Get the number
     * @method getNumber
     * @return
     */
    getNumber() {
        return this.value === null ? null : this.value[0] * Math.pow(10, this.value[1]);
    }
    /**
     * Check equality of numbers
     * @method equals
     * @param {fw/type/Number} number - number to be checked
     * @return {boolean}
     */
    equals(number) {
        return number instanceof FwNumber ? this.getNumber() === number.getNumber() : false;
    }
    /**
     * Add numbers
     * @method add
     * @param {...fw/type/Currency|...fw/type/Number|...fw/type/Integer} numbers - numbers to be added
     * @return {fw/type/Integer}
     */
    add() {
        var result = this.getNumber();
        var n, l;

        for (n = 0, l = arguments.length; n < l; n++) {
            result += getValue(arguments[n]);
        }

        return new FwNumber(result);
    }
    /**
     * Substract numbers
     * @method substract
     * @param {...fw/type/Currency|...fw/type/Number|...fw/type/Integer} numbers - numbers that substracts
     * @return {fw/type/Integer}
     */
    substract() {
        var result = this.getNumber();
        var n, l;

        for (n = 0, l = arguments.length; n < l; n++) {
            result -= getValue(arguments[n]);
        }

        return new FwNumber(result);
    }
    /**
     * Multiply numbers
     * @method multiply
     * @param {...fw/type/Currency|...fw/type/Number|...fw/type/Integer} numbers - numbers to be multiplied
     * @return {fw/type/Integer}
     */
    multiply() {
        var result = this.getNumber();
        var n, l;

        for (n = 0, l = arguments.length; n < l; n++) {
            result *= getValue(arguments[n]);
        }

        return new FwNumber(result);
    }
    /**
     * Divide numbers
     * @method divide
     * @param {...fw/type/Currency|...fw/type/Number|...fw/type/Integer} numbers - numbers that divides
     * @return {fw/type/Integer}
     */
    divide() {
        var result = this.getNumber();
        var n, l;

        for (n = 0, l = arguments.length; n < l; n++) {
            result /= getValue(arguments[n]);
        }

        return new FwNumber(result);
    }
    /**
     * Check if the number is null
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
        } else {
            return options.decimals ?
                String((Math.round(this.getNumber() * pow) / pow).toFixed(options.decimals)) :
                    String((Math.round(this.getNumber() * pow) / pow));
        }
    }
    /**
     * Output the number as a json value
     * @method toJSON
     * @return {number}
     */
    toJSON() {
        return this.getNumber();
    }
    /**
     * Check if the string is a number format
     * @method isNumber
     * @static
     * @param {string} number
     * @return {boolean}
     */
    static isNumber(number) {
        if (!types.isString(number)) return false;
        number = number.trim();
        if (number.length === 0) return true;

        return numberRegExp.test(number);
    }
    /**
     * Check an input value for number testing. This function is called from UI element.
     * @param {string} input - the UI element input value
     * @param {Object} [options] - checkInput options
     * @param {boolean} [options.positive] - add a postive criteria to the check
     * @return {boolean}
     */
    static checkInput(input, options) {
        options = options || {};
        if (!types.isString(input)) return false;
        if (input.length === 0) return true;

        return options.positive ? positiveNumberInputRegExp.test(input) : numberInputRegExp.test(input);
    }
}

module.exports = FwNumber;
