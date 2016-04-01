/**
 * @module fw/ui/Message
 * @license GNU Affero General Public License version 3
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
 * @param {string|fw/i18n/Message} [config.message] - the message content
 * @param {Object} [config.args] - 
 */
class FwMessage extends FwElement {

    static tagName = 'fw-message'; // jshint ignore:line
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */    
    initialize() {
        this.label = null;
        this.configLabel = this.config.label || null;
    }
    /**
     * Process the node config
     * @method processNode
     * @private
     */
    processNode(node) {
        var child = node.firstChild;

        if (child !== null && child.nodeType === 3 && child.nodeValue.trim().length > 0) {
            this.configLabel = child.nodeValue;
        }
    }
    /**
     * Create the node
     * @method buildUI
     * @private
     */
    buildUI() {
        this.setLabel(this.configLabel, this.config.args);
    }
    /**
     * Set the label
     * @method setLabel
     */
    setLabel(label, args) {
        this.label = this.createMessage(label, args);
        this.refresh();
    }
    /**
     * Get the label 
     * @method getLabel
     */
    getLabel() {
        return this.label;
    }
    /**
     * Refresh the message
     * @method refresh
     */
    refresh() {
        fw.emptyNode(this.node);
        this.node.appendChild(document.createTextNode(this.label));
    }
}

module.exports = FwMessage;

