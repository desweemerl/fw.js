/**
 * @module fw/format
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var format = {
    /**
     * Append zero to a string
     * @function formatStringWithZero
     * @param {string} string - string processed
     * @param {number} length - total length of the output string
     * @return {string}
     */
    formatStringWithZero: function(string, length) {
        // If total length is inferior to string length, return the original string
        return string.length >= length ? string : (new Array(length - string.length + 1).join('0')) + string;
    }
};

module.exports = format;
