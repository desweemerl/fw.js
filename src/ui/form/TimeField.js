/**
 * @module fw/ui/form/TextAreaField
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var EditableFormElement = require('./EditableFormElement');
var fw = require('../../Core');
var FwTime = require('../../type/Time');
var KeyboardManager = require('../KeyboardManager');

/**
 * Create an UI time input field element
 * @class
 * @alias module:/fw/ui/form/TimeField
 * @augments fw/ui/form/EditableFormElement
 * @param {Object} [config] - the configuration object of the time field
 * @param {fw/source/DataSource} [config.dataSource]
 * @param {string} [config.property] - the time field datasource property
 * @param {function} [config.onChange] - define an onChange event function
 * @param {boolean} [config.required] - mark the field as required
 * @param {fw/validator/RequiredValidator} [config.requiredValidator] - add a requiredValidator
 */
class FwTimeField extends EditableFormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-timefield'; // jshint ignore:line
    /**
     * Define element className
     * @property classame
     */
    static className = 'fw-timefield'; // jshint ignore:line
    /**
     * Define element type
     * @property type
     */
    static type = FwTime;
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
     * Create the TimeField nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node.innerHTML = '<input type="text" spellcheck="false"></input>';
        this.timeInputNode = this.node.getElementsByTagName('input')[0];
        this.setFocusableNode(this.timeInputNode);
    }
    /**
     * Bind all events to the TimeField node
     * @method bindUI
     * @private
     */
    bindUI() {
        super.bindUI();

        this.on('focus', this.onFocus);
        this.on('blur', this.onBlur);
        this.on('change', this.onChange);
        this.on('keydown', this.onKeyDown);       
        this.on('keypress', this.onKeyPress);       
        
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
    }   
    /**
     * change event handler
     * @method onChange
     * @private
     */
    onChange() {
        var input = this.timeInputNode.value.trim();
        var value = new FwTime(value);

        if (input.length > 0 && value.isNull()) {
            this.restoreValue();
        } else {
            this.timeInputNode.value = value.toString();

            if (!this.value.equals(value)) {
                this.value = value;
                this.refreshDataSource();

                if ( fw.isFunction(this.onChange) ) {
                    this.onChange();
                }
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

                if (n === end  && n < value.length) {
                    result += value[n];
                }
            } else if ((n < start || n >= end) && n < value.length) {
                result += value[n];
            }
        }

        if (!FwTime.checkTimeInput(result)) {
            e.preventDefault();
        }
    }
    /**
     * Set the TimeField required
     * @method setRequired
     * @param {booleani|string} required
     */
    setRequired(required) {
        this.required = fw.isString(required) ? required === 'true' : !!required;
    }
    /**
     * Backup the TimeField value
     * @method backupValue
     * @private
     */
    backupValue () {
        this.originalValue = this.timeInputNode.value;
    }
    /**
     * Restore the TimeField original value
     * @method restoreValue
     * @private
     */
    restoreValue() {
        this.timeInputNode.value = this.originalValue;
    }
    /**
     * Set the TimeField value
     * @method setValue
     * @param {fw/type/Time|string} value
     */
    setValue(value) {
        this.reset();
        this.value = value instanceof FwTime ? value : this.value.setTime(value);
        this.timeInputNode.value = this.value.toString();
        this.refreshDataSource();
    }
}

module.exports = FwTimeField;
