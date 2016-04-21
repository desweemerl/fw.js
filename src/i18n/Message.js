/**
 * @module fw/i18n/Message
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */
'use strict';

var I18n = require('./I18n');
var types = require('../types');

/**
 * Create an instance of fw/i18n/message
 * @class
 * @alias module:fw/i18n/Message
 * @param {Object} [config] - the configuration object parameter
 * @param {string} [config.message] - message content
 * @param {Object} [config.args] - arguments associated with the message
 * @param {Object|string|Array]} [config.i18n] - defined the dictionary(ies) which the message use
 * @param {string} [config.locale] - locale under en(_US) format
 */
class Message {
    /**
     * @constructor
     */
    constructor(config) {
        config = config || {};

        this.setMessage(config.message);
        this.setArgs(config.args);
        this.setI18n(config.i18n);
        this.setLocale(config.locale);
    }
    /**
     * Set a message
     * @method setMessage
     * @param {string} message - message to be stored
     */
    setMessage(message) {
        this.message = (typeof message === 'string') ? message : '';
    }
    /**
     * Add translation dictionary
     * @method addI18n
     * @param {string|object|Array} i18n - the dictionary which contains the translations
     */
    addI18n(i18n) {
        if (types.isObject(i18n) || types.isEmptyString(i18n) || i18n instanceof Array) {
            this.i18n.push(i18n);
        }
    }
    /**
     * Set translation dictionary
     * @method setI18n
     * @param {Array} i18n - the dictionary which contains the translations
     */
    setI18n(i18n) {
        if (i18n instanceof Array) {
            this.i18n = i18n;
        } else if (types.isObject(i18n) || !types.isEmptyString(i18n)) {
            this.i18n = [i18n];
        } else {
            this.i18n = [];
        }
    }
    /**
     * Set the locale
     * @method setLocale
     * @param {string} locale - locale to be used
     */
    setLocale(locale) {
        if (!types.isEmptyString(locale)) {
            this.locale = locale;
        } else {
            this.locale = null;
        }
    }
    /**
     * Set arguments to the message
     * @method setArgs
     * @param {Object} args - arguments
     */
    setArgs(args) {
        this.args = types.isObject(args) ? args : null;
    }
    /**
     * Get arguments of the message
     * @method getArgs
     * @return {Object}
     */
    getArgs() {
        return this.args;
    }
    /**
     * Translate the message to a string
     * @method toString
     * @return {string}
     */
    toString() {
        return I18n.tr({
            dictionaries: this.i18n,
            message:      this.message,
            locale:       this.locale,
            args:         this.args
        });
    }
}

module.exports = Message;
