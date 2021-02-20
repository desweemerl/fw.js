/**
 * @module fw/Cache
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var types = require('./types');

var Cache = {
    // Manage session cache
    session:   {
        /**
         * Set value to the session cache
         * @function session.set
         * @param {string} key - cache key
         * @param {object} value - value to be stored
         * @param {boolean} [stringify=false] - jsonify the value before storing in the cache
         */ 
        set: function(key, value, jsonify) {
            window.sessionStorage.setItem(key, jsonify ? JSON.stringify(value) : value);
        },
        /**
         * Get value from the session cache
         * @function session.get
         * @param {string} key - cache key
         * @param {boolean} [stringify=false] - jsonify the value
         * @return {object}
         */        
        get: function(key, jsonify) {
            return jsonify ? JSON.parse(window.sessionStorage.getItem(key)) : window.sessionStorage.getItem(key);
        },
        /**
         * remove value from the session cache
         * @function session.remove
         * @param {string} key - cache key
         */ 
        remove: function(key) {
            window.sessionStorage.removeItem(key);
        },
        /**
         * clear session cache
         * @function session.clear
         */
        clear: function() {
            window.sessionStorage.clear();
        }        
    },
    // Manage local cache
    local:     {
        /**
         * Set value to the local cache
         * @function local.set
         * @param {string} key - cache key
         * @param {object} value - value to be stored
         * @param {boolean} [stringify=false] - jsonify the value before storing in the cache
         */ 
        set: function(key, value, jsonify) {
            window.localStorage.setItem(key, jsonify ? JSON.stringify(value) : value);
        },
        /**
         * Get value from the local cache
         * @function local.get
         * @param {string} key - cache key
         * @param {boolean} [stringify=false] - jsonify the value
         * @return {object}
         */        
        get: function(key, jsonify) {
            return jsonify ? JSON.parse(window.localStorage.getItem(key)) : window.localStorage.getItem(key);
        },
        /**
         * remove value from the local cache
         * @function local.remove
         * @param {string} key - cache key
         */ 
        remove: function(key) {
            window.localStorage.removeItem(key);
        },
        /**
         * clear local cache
         * @function local.clear
         */
        clear: function() {
            window.localStorage.clear();
        }          
    }
}

module.exports = Cache;
