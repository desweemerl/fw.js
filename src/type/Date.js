/**
 * @module fw/type/Date
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var format = require('../format');
var types = require('../types');
var utils = require('../utils');

var dateYYYYMMDDRegExp = /^\d{1,4}[-\/]\d{1,2}[-\/]\d{1,2}$/;
var dateDDMMYYYYRegExp = /^\d{1,2}[-\/]\d{1,2}[-\/]\d{1,4}$/;
var dateDDMMYYYYInputRegExp = /^[0-9]{1,2}([-\/]([0-9]{1,2}([-\/]([0-9]{1,4})?)?)?)?$/;

/**
 * Create a date
 * @class
 * @alias module:fw/type/Date
 * @param {number|Date|Array|string|fw/type/Date} - create a date from a valid input
 */
class FwDate {
    /**
     * @constructor
     */
    constructor(date) {
        this.setDate(date);
    }
    /**
     * Set the Date
     * @method setDate
     * @param {number|Date|Array|string|fw/type/Date} - set the date from a valid input
     */
    setDate(date) {
        var value, array;

        if (types.isValidNumber(date)) {
            value = new Date(date);
            value = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
        } else if (date instanceof Date) {
            value = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
        } else if (date instanceof Array) {
            if (date.length === 3) {
                value = date;
            }
        } else if (date instanceof FwDate) {
            this.value = date.isNull() ? null : utils.copyArray(date.value);
            return;
        } else if (types.isString(date)) {
            date = date.trim();

            if (FwDate.isDateYYYYMMDD(date)) {
                array = date.split(/[\-\/]/);
                value = [parseInt(array[0], 10), parseInt(array[1], 10), parseInt(array[2], 10)];
            } else if (FwDate.isDateDDMMYYYY(date)) {
                array = date.split(/[\-\/]/);
                value = [parseInt(array[2], 10), parseInt(array[1], 10), parseInt(array[0], 10)];
            }
        }

        if (types.isNotNull(value) && FwDate.isValidDate(value)) {
            this.value = value;
            return;
        }

        this.value = null;
    }
    /**
     * Get the date under array format [year, month, day]
     * @method getDate
     * @return {Array}
     */
    getDate() {
        return this.value;
    }
    /**
     * Check equality of dates
     * @method equals
     * @param {fw/type/Date} date - date to be checked
     * @return {boolean}
     */
    equals(date) {
        if (date instanceof FwDate) {
            return date.isNull() || this.isNull() ?
                date.isNull() && this.isNull() :
                    (this.value[0] === date.value[0] && this.value[1] === date.value[1] && this.value[2] === date.value[2]);
        }

        return false;
    }
    /**
     * Check if the date is null
     * @method isNull
     * @return {boolean}
     */
    isNull() {
        return this.value === null;
    }
    /**
     * Output the date as a YYYY-MM-DD string format
     * @method toString
     * @return {string}
     */
    toString() {
        return this.value === null ?
            '' :
                [format.formatStringWithZero(String(this.value[0]), 4),
                    format.formatStringWithZero(String(this.value[1]), 2),
                    format.formatStringWithZero(String(this.value[2]), 2)].join('-');
    }
    /**
     * Output the date as a DD/MM/YYYY string format
     * @method toDMYString
     * @return {string}
     */
    toDMYString() {
        return this.value === null ?
            '' :
                [format.formatStringWithZero(String(this.value[2]), 2),
                    format.formatStringWithZero(String(this.value[1]), 2),
                    format.formatStringWithZero(String(this.value[0]), 4)].join('/');
    }
    /**
     * Output the date as a json value
     * @method toJSON
     * @return {string}
     */
    toJSON() {
        return this.value === null ?
            null :
                [format.formatStringWithZero(String(this.value[0]), 4),
                    format.formatStringWithZero(String(this.value[1]), 2),
                    format.formatStringWithZero(String(this.value[2]), 2)].join('-');
    }
    /**
     * Check if a date is valid
     * @method isValidDate
     * @static
     * @param {Array} date - date under array format [year, month, day]
     * @return {boolean}
     */
    static isValidDate(date) {
        var checkDate = new Date(date[0], date[1] - 1, date[2]);

        return (!(date[0] !== checkDate.getFullYear() || (date[1] - 1) !== checkDate.getMonth() || date[2] !== checkDate.getDate()));
    }
    /**
     * Check if a date is under YYYYMMDD string format
     * @method isDateYYYYMMDD
     * @static
     * @param {string} date
     * @return {boolean}
     */
    static isDateYYYYMMDD(date) {
        return !types.isString(date) ? false : dateYYYYMMDDRegExp.test(date);
    }
    /**
     * Check if a date is under DDMMYYYY string format
     * @method isDateDDMMYYYY
     * @static
     * @param {string} date
     * @return {boolean}
     */
    static isDateDDMMYYYY(date) {
        return !types.isString(date) ? false : dateDDMMYYYYRegExp.test(date);
    }
    /**
     * Check an input value for date DDMMYYYY string format testing. This function is called from UI element.
     * @method checkDateDDMMYYYYInput
     * @static
     * @param {string} input - the UI element input value
     * @return {boolean}
     */
    static checkDateDDMMYYYYInput(input) {
        if (!types.isString(input)) return false;
        if (input.length === 0) return true;

        return dateDDMMYYYYInputRegExp.test(input);
    }
}

module.exports = FwDate;
