/**
 * @module fw/ui/form/Link
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var fw = require('../../Core');
var FocusableFormElement = require('./FocusableFormElement');
var KeyboardManager = require('../KeyboardManager');

/**
 * Create an UI link element
 * @class
 * @alias module:/fw/ui/form/Link
 * @augments fw/ui/form/FocusableFormElement
 * @param {Object} [config] - the configuration object of the link
 * @param {string|fw/i18n/Message} [config.value] - the link value
 * @param {boolean} [config.disabled] - disable the link
 * @param {function} [config.onClick] - define an onClick event function
 */
class FwLink extends FocusableFormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-link'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-link'; // jshint ignore:line
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */  
    initialize() {
        super.initialize();

        this.label = null;
        this.configLabel = this.config.label || null;
        this.onClick = this.config.onClick || null;
    }
    /**
     * Process this.config.node if defined (to retrieve attributes) and return properties
     * @method processConfigNode
     * @param {Node} node
     * @return {Object} properties
     */
    processNode(node) {
        var child = node.firstChild;

        if (child !== null && child.nodeType === 3 && child.nodeValue.length > 0) {
            this.configLabel = child.nodeValue;
        }
    }
    /**
     * Create the Link nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.linkNode = document.createElement('a');
        this.node.appendChild(this.linkNode);
        this.setLabel(this.configLabel);
    }
    /**
     * Bind all events to the Link node
     * @method bindUI
     * @private
     */
    bindUI() {
        super.bindUI();

        this.on('keydown', this.onKeyDown);
        this.on('click', this.onNodeClick);

        this.onAttributeChange('value', this.setValue);
    }
    /**
     * keydown event handler
     * @method onKeyDown
     * @private
     */
    onKeyDown(e) {
        if (KeyboardManager.isActive('ENTER')) {
            e.preventDefault();
        }
    }
    /**
     * click event handler
     * @method onClick
     * @private
     */
    onNodeClick(e) {
        if (!this.disabled && fw.isFunction(this.onClick)) {
            this.onClick(e);
        }
    }
    /**
     * Set a value to the Link
     * @method setValue
     * @param {string} value
     */
    setValue(value) {
        this.value = fw.isEmptyString(value) ? null : value;
        this.linkNode.setAttribute('href', value || '');
    }
    /**
     * Set a label to the Link
     * @method setLabel
     * @param {string|fw/i18n/Message} value
     */
    setLabel(label) {
        this.label = fw.isEmptyString(label) ? null : label;
        fw.emptyNode(this.linkNode);

        if (this.label !== null) {
            this.linkNode.appendChild(document.createTextNode(this.createMessage(label)));
        }
    }
}

module.exports = FwLink;
