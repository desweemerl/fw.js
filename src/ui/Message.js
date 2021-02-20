/**
 * @module fw/ui/Message
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var FwElement = require('./Element');
var fw = require('../Core');
var Message = require('../i18n/Message');

/**
 * Create an UI button element
 * @class
 * @alias module:fw/ui/Message
 * @augments fw/ui/Element
 * @param {Object} [config] - the configuration object of the message
 * @param {string|fw/i18n/Message} [config.message] - message
 * @param {Object} [config.args] - message arguments
 */
class FwMessage extends FwElement {

    static tagName = 'fw-message'; // jshint ignore:line
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */
    initialize() {
        this.message = null;
        this.configMessage = this.config.message || null;
    }
    /**
     * Process the node config
     * @method processNode
     * @private
     */
    processNode(node) {
        var child = node.firstChild;

        if (child !== null && child.nodeType === 3 && child.nodeValue.trim().length > 0) {
            this.configMessage = child.nodeValue;
        }
    }
    /**
     * Create the node
     * @method buildUI
     * @private
     */
    buildUI() {
        this.setMessage(this.configMessage, this.config.args);
    }
    /**
     * Set the message
     * @method setMessage
     * @param {string|fw/i18n/Message} message - message content
     * @param {Object} args - message arguments
     *
     */
    setMessage(message, args) {
        if (message instanceof Message) {
            this.message = message;

            if (args) {
                this.message.setArgs(args);
            }
        } else {
            this.message = this.createMessage(message, args);
        }

        this.refresh();
    }
    /**
     * Get the message
     * @method getMessage
     * @return {fw/i18n/Message}
     */
    getMessage() {
        return this.Message;
    }
    /**
     * Refresh the message
     * @method refresh
     */
    refresh() {
        fw.emptyNode(this.node);
        this.node.appendChild(document.createTextNode(this.message));
    }
}

module.exports = FwMessage;
