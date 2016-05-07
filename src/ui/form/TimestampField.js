/**
 * @module fw/ui/form/TimestampField
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var EditableFormElement = require('./EditableFormElement');
var fw = require('../../Core');
var FwTimestamp = require('../../type/Timestamp');
var KeyboardManager = require('../KeyboardManager');

/**
 * Create an UI timestamp input field element
 * @class
 * @alias module:/fw/ui/form/TimestampField
 * @augments fw/ui/form/EditableFormElement
 * @param {Object} [config] - the configuration object of the timestamp field
 * @param {fw/source/DataSource} [config.dataSource]
 * @param {string} [config.property] - the timestamp field datasource property
 * @param {function} [config.onChange] - define an onChange event function
 * @param {boolean} [config.required] - mark the field as required
 * @param {fw/validator/RequiredValidator} [config.requiredValidator] - add a requiredValidator
 */
class FwTimestampField extends EditableFormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-timestampfield'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-timestampfield'; // jshint ignore:line
    /**
     * Define element type
     * @property type
     */
    static type = FwTimestamp;
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
     * Create the TimestampField nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        var inputs;

        this.node.innerHTML = '<div class="fw-timestampfield-date"><input type="text" spellcheck="false"></input></div><div class="fw-timestampfield-time"><input type="text"></input></div>';
        input = document.getElementsByTagName('input');
        this.dateInputNode = inputs[0];
        this.timeInputNode = inputs[1]; 
        this.setFocusableNode(this.dateInputNode);
    }
    /**
     * Bind all events to the TimestampField node
     * @method bindUI
     * @private
     */
    bindUI() {
        this.on('focus', this.onFocus);
        this.on('blur', this.onBlur);
        this.on('mousedown', this.onMouseDown);
        this.on('keypress', this.onKeyPress);
        this.on('keydown', this.onKeyDown);

        this.onAttributeChange('require', this.setRequired);
    }
    /**
     * focus event handler
     * @method onFocus
     * @private
     */
    onFocus(e) {
        if (e.target.classList.contains('dateInput')) {
            this.removeClass('timeInputFocused');
            this.addClass('dateInputFocused');
        } else if (e.target.classList.contains('timeInput')) {
            this.addClass('timeInputFocused');
            this.removeClass('dateInputFocused');
        }

        if (!this.insideFocus) {
            this.focused = true;
            this.backupValue();
            this.displayError();
        } else {
            this.insideFocus = false;
        }
    }
   /**
    * blur event handler
    * @method onBlur
    * @private
    */
    onBlur(e) {
        var value, dateInput, timeInput;

        this.removeClass('timeInputFocused');
        this.removeClass('dateInputFocused');

        if (!this.insideFocus) {
            this.focused = false;
            dateInput = this.dateInputNode.value.trim();
            timeInput = this.timeInputNode.value.trim();
            value = new FwTimestamp({ date: dateInput, time: timeInput });

            if ((dateInput.length > 0 || timeInput.length > 0) && value.isNull()) {
                this.restoreValue();
            } else {
                this.dateInputNode.value = value.toDMYString();
                this.timeInputNode.value = value.toHMSString();

                if (!this.value.equals(value)) {
                    this.value = value;
                    this.refreshDataSource();

                    if (fw.isFunction(this.onChange)) {
                        this.onChange();
                    }
                }
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

        this.insideFocus = (this.hasClass('dateInputFocused') && this.timeInputNode.parentNode.contains(e.target)) ||
            (this.hasClass('timeInputFocused') && this.dateInputNode.parentNode.contains(e.target));
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

        if (this.dateInputNode === e.target) {
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

            if (!FwTimestamp.checkDateDDMMYYYYInput(result)) {
                e.preventDefault();
            }
        } else if (this.timeInputNode === e.target) {
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

            if (!FwTimestamp.checkTimeInput(result)) {
                e.preventDefault();
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
        } else if (KeyboardManager.isActive(['TAB'])) {
            this.insideFocus = this.hasClass('dateInputFocused');
        } else if (KeyboardManager.isActive(['CTRL', 'z'])) {
            this.restoreValue();
            e.preventDefault();
        }
    }
   
    /**
     * Set the TimestampField focusable
     * @method setFocusable
     * @param {boolean} focusable
     */
    setFocusable(focusable) {
        if (focusable) {
            this.dateInputNode.disabled = false;
            this.timeInputNode.disabled = false;
        } else {
            if (this.hasClass('timeInputFocused')) {
                this.timeInputNode.blur();
            } else if (this.hasClass('dateInputFocused')) {
                this.dateInputNode.blur();
            }

            this.dateInputNode.disabled = true;
            this.timeInputNode.disabled = true;
        }

        this.focusable = focusable;
    }
    /**
     * Set the TimestampField required
     * @method setRequired
     * @param {boolean|string} required
     */
    setRequired(required) {
        this.required = fw.isString(required) ? required === 'true' : !!required;
    }
    /**
     * Backup the TimestampField value
     * @method backupValue
     * @private
     */
    backupValue() {
        this.originalValue = [this.dateInputNode.value, this.timeInputNode.value];
    }
    /**
     * Restore the TimestampField original value
     * @method restoreValue
     * @private
     */
    restoreValue() {
        this.dateInputNode.value = this.originalValue[0];
        this.timeInputNode.value = this.originalValue[1];
    }
    /**
     * Set the TimestampField value
     * @method setValue
     * @param {fw/type/Timestamp|string} value
     */
    setValue(value) {
        this.reset();
        this.value = value instanceof FwTimestamp ? value : this.value.setTimestamp(value);
        this.dateInputNode.value = this.value.toDMYString();
        this.timeInputNode.value = this.value.toHMSString();
        this.refreshDataSource();
    }
}

module.exports = FwTimestampField;
