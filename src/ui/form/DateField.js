/**
 * @module fw/ui/form/DateField
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var EditableFormElement = require('./EditableFormElement');
var fw = require('../../Core');
var FwDate = require('../../type/Date');
var KeyboardManager = require('../KeyboardManager');

/**
 * Create an UI date input field element
 * @class
 * @alias module:/fw/ui/form/DateField
 * @augments fw/ui/form/EditableFormElement
 * @param {Object} [config] - the configuration object of the date field
 * @param {fw/source/DataSource} [config.dataSource]
 * @param {string} [config.property] - the date field datasource property
 * @param {function} [config.onChange] - define an onChange event function
 * @param {boolean} [config.required] - mark the field as required
 * @param {fw/validator/RequiredValidator} [config.requiredValidator] - add a requiredValidator
 */
class FwDateField extends EditableFormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-datefield'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-datefield'; // jshint ignore:line   
    /**
     * Define element type
     * @property type
     */
    static type = FwDate;
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */  
    initialize() {
        super.initialize();

        this.originalValue = null;
        this.required = this.config.required || false;
        this.requiredValidator = this.config.requiredValidator || null;
    }
    /**
     * Create the DateField nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node.innerHTML = '<input type="text" spellcheck="false"></input>';
        this.dateInputNode = this.node.getElementsByTagName('input')[0];
        this.setFocusableNode(this.dateInputNode);
    }
    /**
     * Bind events to the node
     * @method bindUI
     * @private
     */
    bindUI() {
        super.bindUI();

        this.on('focus', this.onFocus);
        this.on('blur', this.onBlur);
        this.on('change', this.onChange);
        this.on('keypress', this.onKeyPress);
        this.on('keydown', this.onKeyDown);       

        this.onAttributeChange('required', this.setRequired);
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
        this.validate();
    }   
    /**
     * change event handler
     * @method onChange
     * @private
     */
    onChange() {   
        var input = this.dateInputNode.value.trim();
        var value = new FwDate(input);

        if (input.length > 0 && value.isNull()) {
            this.restoreValue();
        } else {
            this.dateInputNode.value = value.toDMYString();

            if (!this.value.equals(value)) {
                this.value = value;
                this.refreshDataSource();

                if (fw.isFunction(this.onChange)) {
                    this.onChange();
                }
            }
        }
    }
    /**
     * keypress event handler
     * @method onKeyPress
     * @private
     */
    onKeyPress(e) {
        if (e.charCode === 0) return;

        var value = e.target.value;
        var result = '';
        var start = e.target.selectionStart;
        var end = e.target.selectionEnd;
        var n, l;

        for (n = 0, l = value.length + 1; n < l; n++) {
            if (n === start) {
                result += String.fromCharCode(e.which);

                if (n === end && n < value.length) {
                    result += value[n];
                }
            } else if ((n < start || n >= end) && n < value.length) {
                result += value[n];
            }
        }

        if (!FwDate.checkDateDDMMYYYYInput(result)) {
            e.preventDefault();
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
     * Set the CurrencyField required
     * @method setRequired
     * @param {boolean} required
     */
    setRequired(required) {
        this.required = fw.isString(required) ? required === 'true' : !!required;
    }
    /**
     * Backup the DateField value
     * @method backupValue
     * @private
     */
    backupValue() {
        this.originalValue = this.dateInputNode.value;
    }
    /**
     * Restore the DateField original value
     * @method restoreValue
     * @private
     */
    restoreValue() {
        this.dateInputNode.value = this.originalValue;
    }
    /**
     * Set the DateField value
     * @method setValue
     * @param {fw/type/Date|string} value
     */
    setValue(value) {
        this.reset();
        this.value = value instanceof FwDate ? value : new FwDate(value);
        this.dateInputNode.value = this.value.toDMYString();
        this.refreshDataSource();
    }
}

module.exports = FwDateField;
