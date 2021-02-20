/**
 * @module fw/type/Timestamp
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var format = require('../format');
var FwDate = require('./Date');
var FwTime = require('./Time');
var types = require('../types');
var utils = require('../utils');

var timestampISORegExp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}/;

/**
 * Create a timestamp
 * @class
 * @alias module:fw/type/Timestamp
 * @param {number|Date|Array|string|Object|fw/type/Timestamp} - create a timestamp from a valid input
 */
class FwTimestamp {
    /**
     * @constructor
     */
    constructor(timestamp) {
        this.setTimestamp(timestamp);
    }
    /**
     * Set the timestamp
     * @method setTimestamp
     * @param {number|Date|Array|string|Object|fw/type/Timestamp} - set the timestamp from a valid input
     */
    setTimestamp(timestamp) {
        var value, date, time, array, dateArray, timeArray;

        if (types.isValidNumber(timestamp)) {
            timestamp = new Date(timestamp);
            value = [timestamp.getFullYear(), timestamp.getMonth() + 1, timestamp.getDate(), timestamp.getHours(), timestamp.getMinutes(), timestamp.getSeconds(), timestamp.getMilliseconds()];
        } else if (timestamp instanceof Date) {
            value = [timestamp.getFullYear(), timestamp.getMonth() + 1, timestamp.getDate(), timestamp.getHours(), timestamp.getMinutes(), timestamp.getSeconds(), timestamp.getMilliseconds()];
        } else if (timestamp instanceof Array) {
            switch (timestamp.length) {
                case 3:
                    value = timestamp;
                    value.splice(3, 0, 0, 0, 0, 0);
                    break;
                case 5:
                    value = timestamp;
                    value.splice(5, 0, 0, 0);
                    break;
                case 6:
                    value = timestamp;
                    value.splice(6, 0, 0);
                    break;
                case 7:
                    value = timestamp;
                    break;
            }
        } else if (timestamp instanceof FwTimestamp) {
            this.value = timestamp.isNull() ? null : utils.copyArray(timestamp.value);
            return;
        } if (types.isString(timestamp)) {
            timestamp = timestamp.trim();

            if (FwTimestamp.isTimestampISO(timestamp)) {
                array = timestamp.split('T');
                dateArray = array[0].split('-');
                timeArray = array[1].replace('.', ':').split(':');
                value = [parseInt(dateArray[0], 10), parseInt(dateArray[1], 10), parseInt(dateArray[2], 10), parseInt(timeArray[0], 10), parseInt(timeArray[1], 10), parseInt(timeArray[2], 10), parseInt(timeArray[3], 10)];
            } else if (FwDate.isDateYYYYMMDD(timestamp)) {
                array = timestamp.split(/\-|\//);
                    value = [parseInt(array[0], 10), parseInt(array[1], 10), parseInt(array[2], 10), 0, 0, 0, 0];
            } else if (FwDate.isDateDDMMYYYY(timestamp)) {
                array = timestamp.split(/\-|\//);
                    value = [parseInt(array[2], 10), parseInt(array[1], 10), parseInt(array[0], 10), 0, 0, 0, 0];
            }
        } else if (types.isObject(timestamp)) {
            if (types.isString(timestamp.date)) {
                date = timestamp.date.trim();

                if (FwDate.isDateYYYYMMDD(date)) {
                    array = date.split(/\-|\//);
                        value = [parseInt(array[0], 10), parseInt(array[1], 10), parseInt(array[2], 10)];
                } else if (FwDate.isDateDDMMYYYY(date)) {
                    array = date.split(/\-|\//);
                        value = [parseInt(array[2], 10), parseInt(array[1], 10), parseInt(array[0], 10)];
                }

                if (value !== undefined && types.isString(timestamp.time)) {
                    time = timestamp.time.trim();

                    if (time.length === 0) {
                        value.splice(3, 0, 0, 0, 0, 0);
                    } else if (FwTime.isTime(time)) {
                        array = time.replace('.', ':').split(':');

                        if (array.length === 2) {
                            value.splice(3, 0, parseInt(array[0], 10), parseInt(array[1], 10), 0, 0);
                        } else if (array.length === 3) {
                            value.splice(3, 0, parseInt(array[0], 10), parseInt(array[1], 10), parseInt(array[2], 10), 0);
                        } else if (array.length === 4) {
                            value.splice(3, 0, parseInt(array[0], 10), parseInt(array[1], 10), parseInt(array[2], 10), parseInt(array[3], 10));
                        }
                    } else {
                        this.value = null;
                        return;
                    }
                }
            }
        }

        if (value !== undefined) {
            if (FwTimestamp.isValidTimestamp(value)) {
                this.value = value;
                return;
            }
        }

        this.value = null;
    }
    /**
     * Get the timestamp under array format [year, month, day, hour, minute, second, millisecond]
     * @method getDate
     * @return {Array}
     */
    getTimestamp() {
        return this.value;
    }
    /**
     * Check equality of timestamps
     * @method equals
     * @param {fw/type/Timestamp} date - timestamp to be checked
     * @return {boolean}
     */
    equals(timestamp) {
        if (timestamp instanceof FwTimestamp) {
            return (timestamp.isNull() || this.isNull()) ?
                timestamp.isNull() && this.isNull() :
                    (this.value[0] === timestamp.value[0] &&
                     this.value[1] === timestamp.value[1] &&
                         this.value[2] === timestamp.value[2] &&
                             this.value[3] === timestamp.value[3] &&
                                 this.value[4] === timestamp.value[4] &&
                                     this.value[5] === timestamp.value[5] &&
                                         this.value[6] === timestamp.value[6]);
        }

        return false;
    }
    /**
     * Check if the timestamp is null
     * @method isNull
     * @return {boolean}
     */
    isNull() {
        return this.value === null;
    }
    /**
     * Output the timestamp as DD/MM/YYYY string format
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
     * Output the timestamp as HH:mm:ss string format
     * @method toHMSString
     * @return {string}
     */
    toHMSString() {
        return this.value === null ?
            '' :
                [format.formatStringWithZero(String(this.value[3]), 2),
                    format.formatStringWithZero(String(this.value[4]), 2),
                    format.formatStringWithZero(String(this.value[5]), 2)].join(':');
    }
    /**
     * Output the timestamp as HH:mm:ss.SSS string format
     * @method toHMSMSString
     * @return {boolean}
     */
    toHMSMSString() {
        return this.value === null ?
            '' :
                [format.formatStringWithZero(String(this.value[3]), 2),
                    format.formatStringWithZero(String(this.value[4]), 2),
                    format.formatStringWithZero(String(this.value[5]), 2)].join(':') + '.' +
                        format.formatStringWithZero(String(this.value[6]), 3);
    }
    /**
     * Output the timestamp as DD/MM/YYYY HH:mm:ss string format
     * @method toDMYHMSString
     * @return {boolean}
     */
    toDMYHMSString() {
        return this.value === null ?
            '' :
                [format.formatStringWithZero(String(this.value[2]), 2),
                    format.formatStringWithZero(String(this.value[1]), 2),
                    format.formatStringWithZero(String(this.value[0]), 4)].join('/') + ' ' +
                        [format.formatStringWithZero(String(this.value[3]), 2),
                            format.formatStringWithZero(String(this.value[4]), 2),
                            format.formatStringWithZero(String(this.value[5]), 2)].join(':');
    }
    /**
     * Output the timestamp as a json value
     * @method toJSON
     * @return {string}
     */
    toJSON() {
        return this.value === null ?
            null :
                new Date(Date.UTC(this.value[0], this.value[1] - 1, this.value[2], this.value[3], this.value[4], this.value[5], this.value[6])).toISOString();
    }
    /**
     * Output the timestamp to a numeric value of time
     * @method toTime
     * @return {number}
     */
    toTime() {
        return this.value === null ?
            null :
                new Date(Date.UTC(this.value[0], this.value[1] - 1, this.value[2], this.value[3], this.value[4], this.value[5], this.value[6])).getTime();
    }
    /**
     * Check if a timestamp is valid
     * @method isValidTimestamp
     * @static
     * @param {Array} timestamp - timestamp under array format [year, month, day, hour, minute, second, millisecond]
     * @return {boolean}
     */
    static isValidTimestamp(datetime) {
        var checkDate = new Date(datetime[0], datetime[1] - 1, datetime[2]);
        var hours = datetime[3];
        var minutes = datetime[4];
        var seconds = datetime[5];
        var milliseconds = datetime[6];

        if (datetime[0] !== checkDate.getFullYear() || (datetime[1] - 1) !== checkDate.getMonth() || datetime[2] !== checkDate.getDate()) {
            return false;
        }

        if (hours > 23 || hours < 0 || minutes > 59 || minutes < 0 || seconds > 59 || seconds < 0 || milliseconds > 999 || milliseconds < 0) {
            return false;
        }

        return true;
    }
    /**
     * Check if a timestamp is under ISO string format
     * @method isTimestampISO
     * @static
     * @param {string} timestamp
     * @return {boolean}
     */
    static isTimestampISO(timestamp) {
        return !types.isString(timestamp) ? false : timestampISORegExp.test(timestamp);
    }   
    /**
     * Check if a date is under YYYYMMDD string format
     * @method isDateYYYYMMDD
     * @static
     * @param {string} date
     * @return {boolean}
     */
    static isDateYYYYMMDD(date) {
        return FwDate.isDateYYYYMMDD(date);
    }
    /**
     * Check if a date is under DDMMYYYY string format
     * @method isDateDDMMYYYY
     * @static
     * @param {string} date
     * @return {boolean}
     */
    static isDateDDMMYYYY(date) {
        return FwDate.isDateDDMMYYYY(date);
    }
    /**
     * Check an input value for date DDMMYYYY string format testing. This function is called from UI element.
     * @method checkDateDDMMYYYYInput
     * @static
     * @param {string} input - the UI element input value
     * @return {boolean}
     */
    static checkDateDDMMYYYYInput(input) {
        return FwDate.checkDateDDMMYYYYInput(input);
    }
    /**
     * Check if the string is a time format
     * @method ckectTimeInput
     * @static 
     * @param {string} time
     * @return {boolean}
     */ 
    static checkTimeInput(time) {
        return FwTime.checkTimeInput(time);
    }
}

module.exports = FwTimestamp;
