/**
 * @module fw/ui/form/TextField
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var EditableFormElement = require('./EditableFormElement');
var fw = require('../../Core');
var KeyboardManager = require('../KeyboardManager');

/**
 * Create an UI text input field element
 * @class
 * @alias module:/fw/ui/form/TextField
 * @augments fw/ui/form/EditableFormElement
 * @param {Object} [config] - the configuration object of the text field
 * @param {fw/source/DataSource} [config.dataSource]
 * @param {string} [config.property] - the date field datasource property
 * @param {function} [config.onChange] - define an onChange event function
 * @param {number} [config/number] - fix the maximum length of the text field
 * @param {boolean} [config.required] - mark the field as required
 * @param {fw/validator/RequiredValidator} [config.requiredValidator] - add a requiredValidator
 */
class FwTextField extends EditableFormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-textfield'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-textfield'; // jshint ignore:line
    /**
     * Define element type
     * @property type
     */
    static type = 'string';
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */  
    initialize() {
        super.initialize();

        this.originalValue = null;
        this.maxLength = this.config.maxLength || null;
        this.required = this.config.required || false;
        this.requiredValidator = this.config.requiredValidator || null;
    }
    /**
     * Create the TestField nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node.innerHTML = '<input type="text" spellcheck="false"></input>';
        this.textInputNode = this.node.getElementsByTagName('input')[0];
        this.setFocusableNode(this.textInputNode);
        this.setMaxLength(this.maxLength);
    }
    /**
     * Bind all events to the TextField node
     * @method bindUI
     * @private
     */
    bindUI() {
        super.bindUI();

        this.on('focus', this.onFocus);
        this.on('blur', this.onBlur);
        this.on('change', this.onChange);
        this.on('keydown', this.onKeyDown);       
        
        this.onAttributeChange('required', this.setRequired);
        this.onAttributeChange('maxlength', this.setMaxLength);   
    }
    /**
     * focus event handler
     * @method onFocus
     * @private
     */
    onFocus() {
        if (!this.focused) {
            this.focused = true;
            this.backupValue();
            this.displayError();
        }
        this.addClass('focused');
    }
    /**
     * blur event handler
     * @method onBlur
     * @private
     */
    onBlur() {
        this.focused = false;
        this.removeClass('focused');
    }
    /**
     * change event handler
     * @method onChange
     * @private
     */
    onChange() {
        var value = this.textInputNode.value.trim();

        this.textInputNode.value = value;

        if (value.length === 0) {
            value = null;
        }

        if (value !== this.value) {
            this.reset();
            this.value = value;
            this.refreshDataSource();

            if (fw.isFunction(this.onChange)) {
                this.onChange();
            }
        }
    }
    /**
     * keydown event handler
     * @method onKeyDown 
     * @private
     */
    onKeyDown(e) {
        if (KeyboardManager.isActive('ENTER')) {
            e.preventDefault();
        } else if (KeyboardManager.isActive(['CTRL', 'z'])) {
            this.restoreValue();
            e.preventDefault();
        }
    }   
    /**
     * Set the maximum length of TextField 
     * @method setMaxLength
     * @param {number|string} maxLength
     */
    setMaxLength(maxLength) {
        if (!fw.isEmptyString(maxLength)) {
            this.maxLength = parseFloat(maxLength, 10) || null; 
        } else if (fw.isValidNumber(maxLength)) {
            this.maxLength = maxLength;
        } else {
            this.maxLength = null;
        }

        this.textInputNode.setAttribute('maxlength', this.maxLength || '');
    }
    /**
     * Set the TextField required
     * @method setRequired
     * @param {boolean} required
     */
    setRequired(required) {
        this.required = fw.isString(required) ? required === 'true' : !!required;
    }
    /**
     * Backup the TextField value
     * @method backupValue
     * @private
     */
    backupValue() {
        this.originalValue = this.textInputNode.value;
    }
    /**
     * Restore the TextField original value
     * @method restoreValue
     * @private
     */
    restoreValue() {
        this.textInputNode.value = this.originalValue;
    }
    /**
     * Set the value of the TextField
     * @method setValue
     * @param {string} value
     */
    setValue(value) {
        this.reset();

        if (fw.isString(value) && value.length > 0) {
            this.value = this.textInputNode.value = value;
        } else {
            this.value = null;
            this.textInputNode.value = '';
        }

        this.refreshDataSource();
    }
}

module.exports = FwTextField;
