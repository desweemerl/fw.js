/**
 * @module fw/ui/Focusify
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var fw = require('../Core');

/**
 * Focusify brings focus feature to the Element
 * @class
 * @alias module:/fw/ui/Focusify
 * @param {Object} config - the configuration object parameter
 * @param {boolean} [config.disabled] - disable the form element
 */
class Focusify {
    /**
     * @constructor
     */
    constructor(config) {
        // Set the element focusable or unfocusabled
        this.setDisabled(this.config.disabled || this.disabled);
	}
    /**
     * Bind events to the node
     * @method bindUI
     */
    bindUI() {
        this.onAttributeChange('disabled', this.setDisabled);
    }
    /**
     * Set the focus on the FocusableElement
     * @method focus
     */
    focus() {
       if (this.disabled) return false;
       this.getFocusableNode().focus();

       return true;
    }
    /**
     * Disable the Element
     * @method setDisabled
     * @param {boolean} disabled - disable the Element
     */
    setDisabled(disabled) {
        disabled = fw.isString(disabled) ? disabled === 'true' : !!disabled; 

        if (this.disabled !== disabled) {
            this.disabled = disabled;

            if (disabled) {
                this.addClass('disabled');
                this.setFocusable(false);
            } else {
                this.removeClass('disabled');
                this.setFocusable(true);
            }
        }
    }
    /**
     * Set the Element focusable
     * @method setFocusable
     * @param {boolean} focusable
     */
    setFocusable(focusable) {
        focusable = !!focusable;

        var focusableNode = this.getFocusableNode();

        if (focusable) {
            if (focusableNode.disabled === undefined) {
                focusableNode.setAttribute('tabindex', '0');
            } else {
                focusableNode.disabled = false;
            }
        } else {
            if (this.focused) {
                focusableNode.blur();
            }

            if (focusableNode.disabled === undefined) {
                focusableNode.removeAttribute('tabindex');
            } else {
                focusableNode.disabled = true;
            }
        }

        this.focusable = focusable;
    }
    /**
     * Define the focusable node
     * @method setFocusableNode
     * @param {Node} focusableNode 
     */
    setFocusableNode(focusableNode) {
        this.focusableNode = focusableNode instanceof Node ? focusableNode : null;
    }
    /**
     * Get the focusable node
     * @method getFocusableNode
     * @return {Node}
     */
    getFocusableNode() {
        return this.focusableNode instanceof Node ? this.focusableNode : this.node;
    }
}

module.exports = Focusify;
