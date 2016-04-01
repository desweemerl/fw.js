/**
 * @module fw/i18n/Translator
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */
'use strict';

var Message = require('./Message');

/**
 * Bring internationalization to a class
 * @class
 * @alias module:fw/ui/Element
 * @param {Object} config - the configuration object parameter
 * @param {Object} [config.i18n] - the dictionary which contains the translations
 * @param {boolean} [config.visible] - set the visibility of the UI Element
 * @param {Node} node - the base node of the UI Element
 */
class Translator {
    /**
     * @constructor
     */
    constructor(config) {
        config = config || {};
        // Add internationalization to the object
        this.i18n = config.i18n || null;
    }
    /**
     * Create a translated message
     * @method createMessage
     * @param {string} message - message to be translated
     * @param {Object} args - message arguments
     * @return {fw/i18n/Message}
     */
    createMessage(message, args) {
        var i18n;

        if (this.constructor.i18n) {
            i18n = this.i18n ? [this.constructor.i18n, this.i18n] : this.constructor.i18n;
        } else if (this.i18n) {
            i18n = this.i18n;
        }

        return new Message({
            i18n:    i18n,
            message: message,
            args:    args
        });
    }
}

module.exports = Translator;
