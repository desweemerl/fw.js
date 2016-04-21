/**
 * @module fw/type/Time
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var format = require('../format');
var types = require('../types');
var utils = require('../utils');

var timeRegExp = /^[0-2]?\d:[0-6]?\d(:[0-6]?\d(\.\d{3})?)?$/;
var timeInputRegExp = /^[0-2]?[0-9](:([0-6]?[0-9](:([0-6]?[0-9])?)?)?)?$/;

/**
 * Create a time
 * @class
 * @alias module:fw/type/Time
 * @param {Array|string|fw/type/Time} - create a time from a valid input
 */
class FwTime {
    /**
     * @constructor
     */
    constructor(time) {
        this.setTime(time);
    }
    /**
     * Set the time
     * @method setTime
     * @param {Array|string|fw/type/Time} - set the time from a valid input
     */
    setTime(time) {
        var value, array;

        if (time instanceof Array) {
            if (time.length === 2) {
                value = time;
                value.splice(2, 0, 0, 0);
            } else if (time.length === 3) {
                value = time;
                value.splice(3, 0, 0);
            }
        } else if (time instanceof FwTime) {
            this.value = time.isNull() ? null : utils.copyArray(time.value);
            return;
        } else if (types.isString(time)) {
            time = time.trim();

            if (FwTime.isTime(time)) {
                array = time.split(':');

                if (array.length === 2) {
                    value = [parseInt(array[0], 10), parseInt(array[1], 10), 0, 0];
                } else {
                    array = time.split(':');
                    value = [parseInt(array[0], 10), parseInt(array[1], 10), parseInt(array[2], 10), 0];
                }
            }
        }

        if (value !== undefined && FwTime.isValidTime(value)) {
            this.value = value;
            return;
        }

        this.value = null;
        return null;
    }
    /**
     * Get the time under array format [hour, minute, second, millisecond]
     * @method getDate
     * @return {Array}
     */
    getTime() {
        return this.value;
    }
    /**
     * Check equality of times
     * @method equals
     * @param {fw/type/Date} date - date to be checked
     * @return {boolean}
     */
    equals(time) {
        if (time instanceof FwTime) {
            return (time.isNull() || this.isNull()) ?
                time.isNull() && this.isNull() :
                    (this.value[0] === time.value[0] && this.value[1] === time.value[1] && this.value[2] === time.value[2] && this.value[3] === time.value[3]);
        }

        return false;
    }
    /**
     * Check if the time is null
     * @method isNull
     * @return {boolean}
     */
    isNull() {
        return this.value === null;
    }
    /**
     * Output the time as a HH:mm:SS string format
     * @method toString
     * @return {string}
     */
    toString() {
        return this.value === null ?
            '' :
                [format.formatStringWithZero(String(this.value[0]), 2),
                    format.formatStringWithZero(String(this.value[1]), 2),
                    format.formatStringWithZero(String(this.value[2]), 2)].join(':');
    }
    /**
     * Output the time as a json value
     * @method toJSON
     * @return {string}
     */
    toJSON() {
        return this.value === null ?
            null :
                [format.formatStringWithZero(String(this.value[0]), 2),
                    format.formatStringWithZero(String(this.value[1]), 2),
                    format.formatStringWithZero(String(this.value[2]), 2)].join(':');
    }
    /**
     * Check if the string is a time format
     * @method isTime
     * @static
     * @param {string} time
     * @return {boolean}
     */
    static isTime(time) {
        return !types.isString(time) ? false : timeRegExp.test(time.trim());
    }
    /**
     * Check if a time is valid
     * @method isValidTime
     * @static
     * @param {Array} time - time under array format [hour, minute (, second (, millisecond))]
     * @return {boolean}
     */
    static isValidTime(time) {
        var hours = time[0];
        var minutes = time[1];
        var seconds = time[2];
        var milliseconds = time[3];

        return !(hours > 23 || hours < 0 || minutes > 59 || minutes < 0 || seconds > 59 || seconds < 0 || milliseconds > 999 || milliseconds < 0);
    }
    /**
     * Check an input value for time HHMMSS string format testing. This function is called from UI element.
     * @method checkTimeInput
     * @static
     * @param {string} input - the UI element input value
     * @return {boolean}
     */
    static checkTimeInput(input) {
        if (!types.isString(input)) return false;
        if (input.length === 0) return true;

        return timeInputRegExp.test(input);
    }
}

module.exports = FwTime;
