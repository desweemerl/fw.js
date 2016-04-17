/**
 * @module fw/ui/form/NumberField
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var DataSource = require('../../source/DataSource');
var EditableFormElement = require('./EditableFormElement');
var fw = require('../../Core');
var FwNumber = require('../../type/Number');
var KeyboardManager = require('../../ui/KeyboardManager');

/**
 * Create an UI number input field element
 * @class
 * @alias module:/fw/ui/form/NumberField
 * @augments fw/ui/form/EditableFormElement
 * @param {Object} [config] - the configuration object of the currency field
 * @param {fw/source/DataSource} [config.dataSource]
 * @param {string} [config.property] - the number field datasource property
 * @param {function} [config.onChange] - define an onChange event function
 * @param {boolean} [config.required] - mark the field as required
 * @param {number} [config.minValue] - set the minimum value allowed
 * @param {number} [config.maxValue] - set the maximum value allowed
 * @param {boolean} [config.positive] - mark the field as positive
 * @param {fw/validator/RequiredValidator} [config.requiredValidator] - add a requiredValidator
 * @param {fw/validator/NumberValidator} [config.numberValidator] - add a numberValidator
 */
class FwNumberField extends EditableFormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-numberfield'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-numberfield'; // jshint ignore:line
    /**
     * Define element type
     * @property type
     */
    static type = FwNumber;
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */  
    initialize() {
        this.originalValue = null;
        this.integer = this.config.integer || false;
        this.required = this.config.required || false;
        this.minValue = this.config.minValue || null;
        this.maxValue = this.config.maxValue || null;
        this.positive = this.config.positive || false;
        this.requiredValidator = this.config.requiredValidator || null;
        this.numberValidator = this.config.numberValidator || null;
    }
    /**
     * Create the NumberField nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node.innerHTML = '<input type="text" spellcheck="false"></input>';
        this.numberInputNode = this.node.getElementsByTagName('input')[0];
        this.setFocusableNode(this.numberInputNode);
    }
    /**
     * Bind all events to the NumberField node
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
        this.onAttributeChange('positive', this.setPositive);
        this.onAttributeChange('integer', this.setInteger);
        this.onAttributeChange('minvalue', this.setMinValue);
        this.onAttributeChange('maxvalue', this.setMaxValue);
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
        var input = this.numberInputNode.value.trim();
        var value = new FwNumber(input);

        if (input.length > 0 && value.isNull()) {
            this.restoreValue();
        } else {
            this.numberInputNode.value = value.toString();

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
        var positive, numberValidator, n, l;

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

        if (this.dataSource instanceof DataSource) {
            numberValidator = this.dataSource.getModel().getOption(this.property, 'numberValidator');
            positive = numberValidator === undefined ? false : numberValidator.positive;
        } else {
            positive = this.positive;
        }

        if (!FwNumber.checkInput(result, { positive: positive })) {
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
     * Set the NumberField required
     * @method setRequired
     * @param {boolean} required
     */
    setRequired(required) {
        this.required = fw.isString(required) ? required === 'true' : !!required;
    }
    /**
     * Set the NumberField positive only
     * @method setPositive
     * @param {boolean} positive
     */
    setPositive(positive) {
        this.positive = fw.isString(positive) ? positive === 'true' : !!positive;
    }
    /**
     * Set the NumberField as integer 
     * @method setInteger
     * @param {boolean} integer
     */
    setInteger(integer) {
        this.integer = fw.isString(integer) ? integer === 'true' : !!integer;
    }   
    /**
     * Set minimum value
     * @method setMinValue
     * @param {number|string} minValue
     */
    setMinValue(minValue) {
        if (fw.isString(minValue)) {
            this.minValue = parseFloat(minValue, 10) || null;
        } else if (fw.isValidNumber(minValue)) {
            this.minValue = minValue;
        } else {
            this.minValue = null;
        }
    }
    /**
     * Set maximum value
     * @method setMaxValue
     * @param {number|string} maxValue
     */
    setMaxValue(maxValue) {
        if (fw.isString(maxValue)) {
            this.maxValue = parseFloat(maxValue, 10) || null;
        } else if (fw.isValidNumber(maxValue)) {
            this.maxValue = maxValue;
        } else {
            this.maxValue = null;
        }
    }      
    /**
     * Backup the NumberField value
     * @method backupValue
     * @private
     */
    backupValue() {
        this.originalValue = this.numberInputNode.value;
    }
    /**
     * Restore the NumberField original value
     * @method restoreValue
     * @private
     */
    restoreValue() {
        this.numberInputNode.value = this.originalValue;
    }
    /**
     * Set the NumberField value
     * @method setValue
     * @param {number|fw/type/Number} value
     */
    setValue(value) {
        this.reset();
        this.value = value instanceof FwNumber ? value : new FwNumber(value, { integer: this.integer });
        this.numberInputNode.value = this.value.toString();
        this.refreshDataSource();
    }
}

module.exports = FwNumberField;
