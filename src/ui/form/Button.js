/**
 * @module fw/ui/form/Button
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var fw = require('../../Core');
var FocusableElement = require('../FocusableElement');
var KeyboardManager = require('../KeyboardManager');

/**
 * Create an UI button element
 * @class
 * @alias module:fw/ui/form/Button
 * @augments fw/ui/FocusableElement
 * @param {Object} [config] - the configuration object of the button
 * @param {string} [config.label] - the button label
 * @param {boolean} [config.disabled] - disable the button
 * @param {function} [config.onClick] - define an onClick event function
 */
class FwButton extends FocusableElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-button'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-button'; // jshint ignore:line   
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
     * Create the Button nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node.setAttribute('tabIndex', '0');
        fw.emptyNode(this.node);
        this.labelNode = document.createElement('span');
        this.node.appendChild(this.labelNode);
        this.setLabel(this.configLabel);
    }
    /**
     * Bind all events to the node
     * @method bindUI
     * @private
     */
    bindUI() {
        super.bindUI();

        this.on('focus', this.onFocus);
        this.on('blur', this.onBlur);
        this.on('click', this.onNodeClick);
        this.on('keydown', this.onKeyDown);
        this.on('mousedown', this.onMouseDown);
        this.on(['mouseup', 'mouseout', 'keyup'], this.desactivate);
    }
    /**
     * focus event handler 
     * @method onFocus
     * @private
     */
    onFocus() {
        this.addClass('focused');
    }
    /**
     * blur event handler
     * @method onBlur
     * @private
     */
    onBlur() {       
        this.removeClass('activated');
        this.removeClass('focused');
    }
    /**
     * click event handler
     * @method onClick
     * @private
     */
    onNodeClick(e) {
        if (this.disabled) {
            e.preventDefault();
            return;
        }

        this.node.focus();

        if (fw.isFunction(this.onClick)) {
            this.onClick(e);
        }
    }
    /**
     * keydown event handler
     * @method onKeyDown
     * @private
     */
    onKeyDown(e) {
        if (this.disabled) {
            e.preventDefault();
            return;
        }

        if (KeyboardManager.isActive('ENTER')) {
            this.addClass('activated');
            if (fw.isFunction(this.onClick)) {
                this.onClick(e);
            }
        }
    }
    /**
     * mousedown event handler
     * @method onMouseDown
     * @private
     */
    onMouseDown(e) {
        if (this.disabled) {
            e.preventDefault();
            return;
        }

        this.addClass('activated');       
    }
    /**
     * mouseup, mouseout and keyup events handler
     * @method desactivate
     * @private
     */
    desactivate() {
        this.removeClass('activated');
    }
    /**
     * Set a label to the Button
     * @method setLabel
     * @param {string} label
     */
    setLabel(label) {
        this.label = this.createMessage(label);
        this.refresh();
    }
    /**
     * Get the Button label
     * @method getLabel
     * @return {fw/i18n/Message}
     */
    getLabel() {
        return this.label;
    }
    /**
     * Refresh the button
     * @method refresh
     */
    refresh() {
        fw.emptyNode(this.labelNode);
        this.labelNode.appendChild(document.createTextNode(this.label));
    }
}

module.exports = FwButton;
