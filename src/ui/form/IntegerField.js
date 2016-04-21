/**
 * @module fw/ui/form/IntegerField
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var DataSource = require('../../source/DataSource');
var EditableFormElement = require('./EditableFormElement');
var fw = require('../../Core');
var FwInteger = require('../../type/Integer');
var KeyboardManager = require('../KeyboardManager');

/**
 * Create an UI integer input field element
 * @class
 * @alias module:/fw/ui/form/IntegerField
 * @augments fw/ui/form/EditableFormElement
 * @param {Object} [config] - the configuration object of the integer field
 * @param {fw/source/DataSource} [config.dataSource]
 * @param {string} [config.property] - the currency field datasource property
 * @param {function} [config.onChange] - define an onChange event function
 * @param {boolean} [config.required] - mark the field as required
 * @param {number} [config.minValue] - set the minimum value allowed
 * @param {number} [config.maxValue] - set the maximum value allowed
 * @param {boolean} [config.positive] - mark the field as positive
 * @param {fw/validator/RequiredValidator} [config.requiredValidator] - add a requiredValidator
 * @param {fw/validator/NumberValidator} [config.numberValidator] - add a numberValidator
 */
class FwIntegerField extends EditableFormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-integerfield'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-integerfield'; // jshint ignore:line
    /**
     * Define element type
     * @property type
     */
    static type = FwInteger;
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */  
    initialize() {
        super.initialize();:

        this.originalValue = null;
        this.required = this.config.required || false;
        this.minValue = this.config.minValue || null;
        this.maxValue = this.config.maxValue || null;
        this.positive = this.config.positive || false;
        this.requiredValidator = this.config.requiredValidator || null;
        this.numberValidator = this.config.numberValidator || null;
    }
    /**
     * Create the IntegerField nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node.innerHTML = '<input type="text" spellcheck="false"></input>';
        this.integerInputNode = this.node.getElementsByTagName('input')[0];
        this.setFocusableNode(this.integerInputNode);
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
        this.onAttributeChange('positive', this.setPositive);
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
        var input = this.integerInputNode.value.trim();
        var value = new FwInteger(input);

        if (input.length > 0 && value.isNull()) {
            this.restoreValue();
        } else {
            this.integerInputNode.value = value.toString();

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

        if (!FwInteger.checkInput(result, { positive: positive })) {
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
     * Set the IntegerField required
     * @method setRequired
     * @param {boolean} required
     */
    setRequired(required) {
        this.required = fw.isString(required) ? required === 'true' : !!required;
    }
     /**
     * Set the IntegerField positive only
     * @method setPositive
     * @param {boolean} positive
     */
    setPositive(positive) {
        this.positive = fw.isString(positive) ? positive === 'true' : !!positive;
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
     * Backup the IntegerField value
     * @method backupValue
     * @private
     */
    backupValue() {
        this.originalValue = this.integerInputNode.value;
    }
    /**
     * Restore the IntegerField original value
     * @method restoreValue
     * @private
     */
    restoreValue() {
        this.integerInputNode.value = this.originalValue;
    }
    /**
     * Set the IntegerField value
     * @method setValue
     * @param {number|fw/type/Integer} value
     */
    setValue(value) {
        this.reset();
        this.value = value instanceof FwInteger ? value : new FwInteger(value, { integer: this.integer });
        this.integerInputNode.value = this.value.toString();
        this.refreshDataSource();
    }
}

module.exports = FwIntegerField;
