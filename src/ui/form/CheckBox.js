/**
 * @module fw/ui/form/CheckBox
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var fw = require('../../Core');
var EditableFormElement = require('./EditableFormElement');
var KeyboardManager = require('../KeyboardManager');

/**
 * Create an UI checkbox element
 * @class
 * @alias module:/fw/ui/form/CheckBox
 * @augments fw/ui/form/EditableFormElement
 * @param {Object} [config] - the configuration object of the checkbox
 * @param {fw/source/DataSource} [config.dataSource]
 * @param {string} [config.property] - the checkbox datasource property
 * @param {function} [config.onChange] - define an onChange event function
 * @param {string} [config.label] - the checkbox label
 */
class FwCheckBox extends EditableFormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-checkbox'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-checkbox'; // jshint ignore:line   
    /**
     * Define element type
     * @property type
     */
    static type = 'boolean';
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */  
    initialize() {
        this.updated = false;
        this.value = false;
        this.originalValue = false;
        this.label = null;
    }
    /**
     * Create the CheckBox nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node.innerHTML = '<div tabindex="0" class="fw-checkbox-frame"></div>';
        this.frameNode = this.node.getElementsByClassName('fw-checkbox-frame')[0];

        this.setFocusableNode(this.frameNode);
        this.setLabel(this.config.label);
    }
    /**
     * Bind events to the node
     * @method bindUI
     * @private 
     */
    bindUI() {
        super.bindUI();

        this.on('focus', this.onFocus);
        this.on('click', this.onClick);
        this.on('blur', this.onBlur);
        this.on('keydown', this.onKeyDown);
        this.on('mousedown', this.onMouseDown);
        this.on(['keyup', 'mouseup', 'mouseout'], this.desactivate);

        this.onAttributeChange('label', this.setLabel);
    }
    /**
     * focus event handler
     * @method onFocus
     * @private
     */
    onFocus() {
        if (!this.focused) {
            this.focused = true;
            this.updated = false;
            this.backupValue();
            this.displayError();
        }

        this.addClass('focused');
    }
    /**
     * click event handler
     * @method onClick
     * @private
     */
    onClick(e) {
        if (this.disabled) {
            e.preventDefault();
            return;
        }

        if (this.frameNode.contains(e.target)) {
            this.frameNode.focus();
            this.toggleValue();
        }   

    }
    /**
     * blur event handler
     * @method onBlur
     * @private
     */
    onBlur() {
        this.focused = false;
        this.removeClass('focused');
        this.removeClass('activated');
    }
    /**
     * keydown event handler
     * @method onKeyDown
     * @private
     */   
    onKeyDown(e) {
        if (KeyboardManager.isActive('ENTER') || KeyboardManager.isActive('SPACE')) {
            this.toggleValue();
            this.addClass('activated');
        } else if (KeyboardManager.isActive(['CTRL', 'z'])) {
            this.restoreValue();
            e.preventDefault();
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
     * keyup mouseup and mouseout events handler
     * @method desactivate
     * @private
     */
    desactivate() {
        this.removeClass('activated');
    }
    /**
     * Toggle the CheckBox value
     * @method toggleValue
     */
    toggleValue() {
        this.setValue(!this.hasClass('checked'));
        this.refreshDataSource();
        this.updated = true;

        if (fw.isFunction(this.onChange)) {
            this.onChange();
        }
    }
    /**
     * Backup the CheckBox value
     * @method backupValue
     * @private
     */
    backupValue() {
        this.originalValue = this.value;
    }
    /**
     * Restore the CheckBox original value
     * @method restoreValue
     * @private
     */
    restoreValue() {
        if (this.updated) {
            this.setValue(this.originalValue);
            this.updated = false;
        }
    }
    /**
     * Set a label to the checkbox
     * @method setLabel
     * @param {string} label
     */
    setLabel(label) {
        this.label = this.createMessage(label);

        if (this.labelNode) {
            fw.emptyNode(this.labelNode);
        } else {
            this.labelNode = document.createElement('div');
            this.node.appendChild(this.labelNode);
        }

        this.labelNode.setAttribute('class', 'fw-checkbox-label');       
        this.labelNode.appendChild(document.createTextNode(this.label));
    }
    /**
     * Get the Button label
     * @method getLabel
     * @return {string}
     */
    getLabel() {
        return this.label;
    }
    /**
     * Set the CheckBox value
     * @method setValue
     * @param {boolean} value
     */
    setValue(value) {
        this.reset();
        this.value = !!value;

        if (this.value) {
            this.addClass('checked');
        } else {
            this.removeClass('checked');
        }

        this.refreshDataSource();
    }
    /**
     * Set the CheckBox value to false
     * @method clear
     */
    clear() {
        this.setValue(false);
    }
}

module.exports = FwCheckBox;
