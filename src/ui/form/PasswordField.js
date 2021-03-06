/**
 * @module fw/ui/form/PasswordField
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var EditableFormElement = require('./EditableFormElement');
var fw = require('../../Core');
var KeyboardManager = require('../KeyboardManager');

/**
 * Create an UI password input field element
 * @class
 * @alias module:/fw/ui/form/PasswordField
 * @augments fw/ui/form/EditableFormElement
 * @param {Object} [config] - the configuration object of the password field
 * @param {fw/source/DataSource} [config.dataSource]
 * @param {string} [config.property] - the currency field datasource property
 * @param {function} [config.onChange] - define an onChange event function
 * @param {boolean} [config.required] - mark the field as required
 * @param {boolean} [config.maxLength] - maximum length of the password field
 * @param {fw/validator/RequiredValidator} [config.requiredValidator] - add a requiredValidator
 */
class FwPasswordField extends EditableFormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-passwordfield'; // jshint ignore:line
    /**
     * Define element classame
     * @property className
     */
    static className = 'fw-passwordfield'; // jshint ignore:line
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
     * Create the PasswordField nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node.innerHTML = '<input type="password" spellcheck="false"></input>';
        this.passwordInputNode = this.node.getElementsByTagName('input')[0];
        this.setFocusableNode(this.passwordInputNode);
        this.setMaxLength(this.maxLength);
    }
    /**
     * Bind all events to the PasswordField node
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
        var value = this.passwordInputNode.value.trim();

        this.passwordInputNode.value = value;

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
     * Set the maximum length of PasswordField
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

        this.passwordInputNode.setAttribute('maxlength', this.maxLength || '');
    }
    /**
     * Set the PasswordField required
     * @method setRequired
     * @param {boolean|string} required
     */
    setRequired(required) {
        this.required = fw.isString(required) ? required === 'true' : !!required;
    }
    /**
     * Backup the PasswordField value
     * @method backupValue
     * @private
     */
    backupValue() {
        this.originalValue = this.passwordInputNode.value;
    }
    /**
     * Restore the PasswordField original value
     * @method restoreValue
     * @private
     */
    restoreValue() {
        this.passwordInputNode.value = this.originalValue;
    }
    /**
     * Set the PasswordField value
     * @method setValue
     * @param {string} value
     */
    setValue(value) {
        this.reset();

        if (fw.isString(value) && value.length > 0) {
            this.value = this.passwordInputNode.value = value;
        } else {
            this.value = null;
            this.passwordInputNode.value = '';
        }

        this.refreshDataSource();
    }
}

module.exports = FwPasswordField;
