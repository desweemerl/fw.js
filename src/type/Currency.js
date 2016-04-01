/**
 * @module fw/type/Currency
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var types = require('../types');

var currencyInputRegExp = /^-?\d*(\.\d{0,2})?(\s*€?)?$/;
var positiveCurrencyInputRegExp = /^\d*(\.\d{0,2})?(\s*€?)?$/;
var currencyRegExp = /^-?\d*(\.\d{0,2})?(\s*€?)?$/;

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
 * Create a currency
 * @class
 * @alias module:fw/type/Currency
 * @param {string|number|fw/tpe/Currency} - create a currency from a valid input
 */
class FwCurrency {
    /**
     * @constructor
     */
    constructor(currency) {
        this.setCurrency(currency);
    }
    /**
     * Set the currency
     * @method setCurrency
     * @param {string|number|fw/type/Currency} - set the currency from a valid input
     */
    setCurrency(currency) {
        if (types.isString(currency)) {
            if (currency.trim().length > 0 && FwCurrency.isCurrency(currency)) {
                currency = parseFloat(currency, 10);
            }
        } else if (currency instanceof FwCurrency) {
            this.value = currency.value;
            return;
        }

        if (types.isValidNumber(currency)) {
            this.value = currency;
            return;
        }

        this.value = null;
    }
    /**
     * Get the currency
     * @method getCurrency
     * @return {number} currency
     */
    getCurrency() {
        return this.value;
    }
    /**
     * Check equality of currencies
     * @method equals
     * @param {fw/type/Currency} currency - currency to be checked
     * @return {boolean}
     */
    equals(currency) {
        return currency instanceof FwCurrency ? this.getCurrency() === currency.getCurrency() : false;
    }
    /**
     * Add currencies
     * @method add
     * @param {...fw/type/Currency|...fw/type/Number|...fw/type/Integer} currencies - currencies to be added
     * @return {fw/type/Currency}
     */
    add() {
        var result = this.value;
        var n, l;

        for (n = 0, l = arguments.length; n < l; n++) {
            result += getValue(arguments[n]);
        }

        return new FwCurrency(result);
    }
    /**
     * Substract currencies
     * @method substract
     * @param {...fw/type/Currency|...fw/type/Number|...fw/type/Integer} currencies - currencies that substracts
     * @return {fw/type/Currency}
     */
    substract() {
        var result = this.value;
        var n, l;

        for (n = 0, l = arguments.length; n < l; n++) {
            result -= getValue(arguments[n]);
        }

        return new FwCurrency(result);
    }
    /**
     * Multiply currencies
     * @method multiply
     * @param {...fw/type/Currency|...fw/type/Number|...fw/type/Integer} currencies - currencies to be multiplied
     * @return {fw/type/Currency}
     */
    multiply() {
        var result = this.value;
        var n, l;

        for (n = 0, l = arguments.length; n < l; n++) {
            result *= getValue(arguments[n]);
        }

        return new FwCurrency(result);
    }
    /**
     * Divide currencies
     * @method divide
     * @param {...fw/type/Currency|...fw/type/Number|...fw/type/Integer} currencies - currency that divides
     * @return {fw/type/Currency}
     */
    divide() {
        var result = this.value;
        var n, l;

        for (n = 0, l = arguments.length; n < l; n++) {
            result /= getValue(arguments[n]);
        }

        return new FwCurrency(result);
    }
    /**
     * Check if the currency is null
     * @method isNull
     * @return {boolean}
     */
    isNull() {
        return this.value === null;
    }
    /**
     * Output the currency as a string
     * @method toString
     * @return {string}
     */
    toString() {
        return this.value === null ? '' : this.value.toFixed(2) + ' \u20ac';
    }
    /**
     * Output the currency as a json value
     * @method toJSON
     * @return {string}
     */
    toJSON() {
        return this.value === null ? null : this.value.toString();
    }
    /**
     * Check if the string is a currency format
     * @method isCurrency
     * @static
     * @param {string} currency
     * @return {boolean}
     */
    static isCurrency(currency) {
        if (!types.isString(currency)) return false;
        currency = currency.trim();
        if (currency.length === 0) return true;

        return currencyRegExp.test(currency);
    }
    /**
     * Check an input value for currency testing. This function is called from UI element.
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

        return options.positive ? positiveCurrencyInputRegExp.test(input) : currencyInputRegExp.test(input);
    }
}

module.exports = FwCurrency;
