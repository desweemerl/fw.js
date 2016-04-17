/**
 * @module fw/ui/form/SelectField
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var DataSource = require('../../source/DataSource');
var EditableFormElement = require('./EditableFormElement');
var fw = require('../../Core');
var KeyboardManager = require('../KeyboardManager');

var DEFAULT_MAX_LINES = 10;

/**
 * Create an UI select field element
 * @class
 * @alias module:/fw/ui/form/SelectField
 * @augments fw/ui/form/EditableFormElement
 * @param {Object} [config] - the configuration object of the search field
 * @param {fw/source/DataSource} [config.dataSource]
 * @param {string} [config.property] - the search field datasource property
 * @param {key} [config.key] - key associated to the SelectField
 * @param {string} [config.label] - value displayed
 * @param {Array} [config.options] - options that populate the SelectField
 * @param {Object|Array} [config.values] - dataSource values affected by an update
 * @param {boolean} [config.nullable] - set the search field nullable
 * @param {number} [config.maxLines=10] - set the max. number of lines displayed
 * @param {function} [config.onChange] - define an onChange event function
 * @param {boolean} [config.required] - mark the field as required
 * @param {fw/validator/RequiredValidator} [config.requiredValidator] - add a requiredValidator
 */
class FwSelectField extends EditableFormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-selectfield'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-selectfield'; // jshint ignore:line
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */  
    initialize() {
        this.updated = false;
        this.focused = false;
        this.currentLabel = '';
        this.originalValue = '';
        this.originalItem = {};
        this.item = {};
        this.listVisible = false;
        this.nodeOffset = { top: 0, left: 0 };

        this.key = this.config.key || null;
        this.label = this.config.label || null;
        this.options = this.config.options || [];
        this.values = this.config.values || null;
        this.nullable = this.config.nullable || false;
        this.maxLines = this.config.maxLines || DEFAULT_MAX_LINES;
        this.required = this.config.required || false;
        this.requiredValidator = this.config.requiredValidator || null;

    }
    /**
     * Create the SelectField node
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node.innerHTML = '\
            <div class="fw-selectfield-input">\
                <input type="text" spellcheck="false"></input>\
            </div>\
            <div class="fw-selectfield-button"><div><div></div></div></div>';
        this.selectButtonNode = this.node.getElementsByClassName('fw-selectfield-button')[0];
        this.selectInputNode = this.node.getElementsByTagName('input')[0];
        this.setFocusableNode(this.selectInputNode);
        this.listUlNode = null;
        this.setOptions(this.options);
    }
    /**
     * Bind all events to the SelectField node
     * @method bindUI
     * @private
     */
    bindUI() {
        super.bindUI();

        this.on('focus', this.onFocus);
        this.on('blur', this.onBlur);
        this.on('mousedown', this.onMouseDown);
        this.on('keyup', this.onKeyUp);
        this.on('keydown', this.onKeyDown);
        this.on(['mouseup', 'mouseout'], this.desactivate); 

        this.onAttributeChange('key', this.setKey);
        this.onAttributeChange('label', this.setLabel);
        this.onAttributeChange('required', this.setRequired);
        this.onAttributeChange('nullable', this.setNullable);
        this.onAttributeChange('maxlines', this.setMaxLines);       
    }
   /**
     * mouseover event handler for list node
     * @method onListMouseOver
     * @private
     */
    onListMouseOver(e) {   
        var found = false;
        var n, l, node, nodes;

        if (e.target.nodeName === 'LI') {
            nodes = this.listUlNode.getElementsByClassName('selected');

            for (n = 0, l = nodes.length; n < l; n++) {
                node = nodes[n];

                if (e.target !== node) {
                    node.classList.remove('selected');
                } else {
                    found = true;
                }
            }

            if (!found) {
                e.target.classList.add('selected');
            }
        }
    }
    /**
     * mousedown event handler for list node
     * @method onListMouseDown
     * @private
     */
    onListMouseDown(e) {   
        if (e.target.nodeName === 'LI') {
            this.updateValue();
            this.selectInputNode.focus();
            e.preventDefault();
        }
    }
    /**
     * focus event handler
     * @method onFocus
     * @private
     */
    onFocus() {
        if (!this.focused) {
            this.updated = false;
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
        this.onLeave();
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

        if (this.selectButtonNode.contains(e.target)) {
            this.selectButtonNode.classList.add('activated');
            this.selectInputNode.focus();
            this.showSelectList();
            e.preventDefault();
        } else {
            this.selectInputNode.focus();
            e.preventDefault();
        }
    }
    /**
     * keyup event handler
     * @method onKeyUp
     * @private
     */
    onKeyUp(e) {   
        if (!this.disabled) {
            if (KeyboardManager.isActive('ENTER')) {
                this.updateValue();
            } else if (KeyboardManager.isActive(['CTRL', 'z'])) {
                this.restoreValue();
            } else if (
                !KeyboardManager.isActive('ARROW_UP') &&
                !KeyboardManager.isActive('ARROW_DOWN') &&
                !KeyboardManager.isActive('TAB')) {    

                this.showSelectList(this.selectInputNode.value);

                if (this.listUlNode === null) {
                    e.preventDefault();
                    return;
                } else if (this.nullable) {
                    if (this.listUlNode.childNodes.length > 1) {
                        this.listUlNode.childNodes[1].classList.add('selected');
                    } else {
                        this.listUlNode.firstElementChild.classList.add('selected');
                    }
                } else if (this.listUlNode.firstElementChild !== null) {
                    this.listUlNode.firstElementChild.classList.add('selected');
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
        var selected, selectedPrevious, selectedNext;

        if ((this.disabled && !KeyboardManager.isActive('TAB')) || KeyboardManager.isActive('ENTER') || KeyboardManager.isActive(['CTRL', 'z']))  {
            e.preventDefault();
        } else if (KeyboardManager.isActive('ARROW_UP')) {
            if (this.listUlNode === null) {
                this.showSelectList(this.selectInputNode.value);

                if (this.listUlNode === null) {
                    e.preventDefault();
                    return;
                }
            }

            selected = this.listUlNode.getElementsByClassName('selected')[0];

            if (selected !== undefined) {
                selected.classList.remove('selected');
                selectedPrevious = selected.previousElementSibling === null ? this.listUlNode.lastElementChild : selected.previousElementSibling;
                selectedPrevious.classList.add('selected');
            } else if (this.listUlNode.lastElementChild !== null) {
                this.listUlNode.lastElementChild.classList.add('selected');
            }
            e.preventDefault();
        } else if (KeyboardManager.isActive('ARROW_DOWN')) {
            if (this.listUlNode === null) {
                this.showSelectList(this.selectInputNode.value);

                if (this.listUlNode === null) {
                    e.preventDefault();
                    return;
                }
            }

            selected = this.listUlNode.getElementsByClassName('selected')[0];

            if (selected !== undefined) {
                selected.classList.remove('selected');
                selectedNext = selected.nextElementSibling === null ? this.listUlNode.firstElementChild : selected.nextElementSibling;
                selectedNext.classList.add('selected');
            } else if (this.listUlNode.firstElementChild !== null) {
                this.listUlNode.firstElementChild.classList.add('selected');
            }
            e.preventDefault();
        } else if ( 
           KeyboardManager.isActive('ARROW_LEFT') || 
           KeyboardManager.isActive('ARROW_DOWN')) {                   
           if (this.listUlNode !== null) {
                e.preventDefault();
           }
        }
    }
    /**
     * mouseup and mouseout events handler
     * @method desactivate
     * @private
     */
    desactivate(e) {
        if (this.selectButtonNode.contains(e.target)) {
            this.selectButtonNode.classList.remove('activated');
        }
    } 
   /**
     * set SelectList key 
     * @method setKey
     * @param {string} key
     */
    setKey(key) {
        this.key = fw.isEmptyString(key) ? null : key;
    }      
   /**
     * set SelectList label
     * @method setLabel
     * @param {string} label
     */
    setLabel(label) {
        this.label = fw.isEmptyString(label) ? null : label;
    } 
    /**
     * Set the SelectField required
     * @method setRequired
     * @param {boolean} required
     */
    setRequired(required) {
        this.required = fw.isString(required) ? required === 'true' : !!required;
    } 
    /**
     * Set the SelectField nullable
     * @method setNullable
     * @param {boolean|string} nullable
     */
    setNullable(nullable) {
        this.nullable = fw.isString(nullable) ? nullable === 'true' : !!nullable;
    }   
   /**
     * Set maximum lines
     * @method setMaxLines
     * @param {number|string} maxLines
     */
    setMaxLines(maxLines) {
        if (fw.isString(maxLines)) {
            this.maxLines = parseFloat(maxLines, 10) || DEFAULT_MAX_LINES;
        } else if (fw.isValidNumber(maxLines)) {
            this.maxLines = maxLines;
        } else {
            this.maxLines = DEFAULT_MAX_LINES;
        }
    }
    /**   
    /**
     * Refresh the DataSource if defined
     * @method refreshDataSource
     * @private
     */
    refreshDataSource() {
        if (this.dataSource instanceof DataSource && !this.sync) {
            this.dataSource.setValues(this.getValues());
        }
    }
    /**
     * Backup the SelectField value
     * @method backupValue
     * @private
     */
    backupValue() {
        var key, n, l;

        this.originalValue = this.value;
        this.originalValue = this.selectInputNode.value;

        if (this.dataSource instanceof DataSource) {
            if (this.values instanceof Array) {
                for (n = 0, l = this.values.length; n < l; n++) {
                    key = this.values[n];
                    this.originalItem[key] = this.dataSource.getValue(key);
                }
            } else if (fw.isObject(this.values)) {
                for (key in this.values) {
                    this.originalItem[key] = this.dataSource.getValue(this.values[key]);
                }
            }
        }
    }
    /**
     * Restore the SelectField original value
     * @method restoreValue
     * @private
     */
    restoreValue() {
        this.value = this.originalValue;
        this.currentLabel = this.selectInputNode.value = this.originalValue;

        if (this.updated) {
            this.item = this.originalItem;
            this.refreshDataSource();
            this.updated = false;
        }

        this.hideSelectList();
    }
    /**
     * Update the SelectField value
     * @method updateValue
     * @private
     */
    updateValue() {
        var modifyAllowed = true;
        var label = this.selectInputNode.value;
        var selected;

        if (this.listUlNode !== null) {
            selected = this.listUlNode.getElementsByClassName('selected')[0];

            if (selected !== undefined) {
                label = selected.classList.contains('empty') ? '' : selected.firstChild.textContent;
            }

            this.hideSelectList();
        } else if (label === this.currentLabel) {
            return;
        }

        this.setValueFromLabel(label);

        if (fw.isFunction(this.allowModify)) {
            modifyAllowed = this.allowModify(this.value);
        }

        if (modifyAllowed) {
            this.reset();
            this.refreshDataSource();

            if (fw.isFunction(this.onChange)) {
                this.onChange();
            }
        } else {
            this.restoreValue();
        }

        this.updated = true;
    }
    /**
     * Populate the SelectField with options
     * @method setOptions
     * @param {Array} options
     */
    setOptions(options) {
        var n, l, option;

        if (!(options instanceof Array)) {
            options = [options];
        }

        if (this.nullable) {
            this.keys = [null];
            this.labels = [''];
        } else {
            this.keys = [];
            this.labels = [];
        }

        this.options = options;

        for (n = 0, l = options.length; n < l; n++) {
            option = options[n];
            this.keys.push(option[this.key]);
            this.labels.push(String(option[this.label]));
        }

        if (l > 0) {
            this.defaultValue = this.keys[0];
        }
    }
    /**
     * Show the select list
     * @method showSelectList
     * @private
     * @param {string} filter
     */
    showSelectList(filter) {
        var self = this;
        var labels = [];
        var truncateY, listNode, filterLowerCase, label, child, childHeight, n, l;

        function listHandler() {
            var currentOffset = fw.getOffset(self.node);

            if (self.nodeOffset.top !== currentOffset.top) {
                self.nodeOffset.top = currentOffset.top;
                listNode.style.top = String(self.nodeOffset.top + self.node.offsetHeight) + 'px';
            }

            if (self.nodeOffset.left !== currentOffset.left) {
                self.nodeOffset.left = currentOffset.left;
                listNode.style.left = String(self.nodeOffset.left) + 'px';
            }

            if (self.listVisible) {
                window.setTimeout(listHandler, 1);
            }
        }

        if (filter) {
            filterLowerCase = filter.toLowerCase();

            if (this.nullable) {
                labels.push('');
            }

            for (n = 0, l = this.labels.length; n < l; n++) {
                label = this.labels[n];

                if (label.toLowerCase().indexOf(filterLowerCase) === 0) {
                    labels.push(label);
                }
            }
        } else {
            labels = this.labels;
        }

        l = labels.length;

        if (l > 0) {
            if (this.listUlNode === null) {
                listNode = document.createElement('div');
                listNode.style.top = 0;
                listNode.style.left = 0;
                listNode.style.height = 0;
                listNode.style.width = 0;
                listNode.classList.add('fw-selectfield-list');
                this.listUlNode = document.createElement('ul');
                this.listUlNode.classList.add('fw-selectfield-list-ul');
                listNode.appendChild(this.listUlNode);
                listNode.addEventListener('mouseover', function(listenerEvent) { self.onListMouseOver.call(self, listenerEvent); }, false);
                listNode.addEventListener('mousedown', function(listenerEvent) { self.onListMouseDown.call(self, listenerEvent); }, false);
                document.body.appendChild(listNode);
            } else {
                listNode = this.listUlNode.parentNode;
                listNode.style.top = 0;
                listNode.style.left = 0;
                listNode.style.height = 0;
                listNode.style.width = 0;
                fw.emptyNode(this.listUlNode);
            }

            truncateY = l > this.maxLines;

            for (n = 0; n < l; n++) {
                label = labels[n];
                child = document.createElement('li');
                child.classList.add('fw-selectfield-list-li');

                if (label === null || label.trim().length === 0) {
                    child.classList.add('empty');
                } else {
                    child.appendChild(document.createTextNode(label));
                }

                this.listUlNode.appendChild(child);

                if (n === 0) {
                    if (truncateY) {
                        this.listUlNode.style.overflowY = 'scroll';
                        childHeight = child.offsetHeight;
                    } else {
                        this.listUlNode.style.overflowY = '';
                    }
                }
            }

            this.listVisible = true;
            listNode.style.top = String(this.nodeOffset.top + this.node.offsetHeight) + 'px';
            listNode.style.left = String(this.nodeOffset.left) + 'px';
            this.listUlNode.style.height = truncateY ? String(childHeight * this.maxLines) + 'px' : '';
            listNode.style.width = String(this.node.offsetWidth) + 'px';
            listNode.style.zIndex = this.getzIndex() + 2;
            listHandler();
        } else {
            this.hideSelectList();
        }
    }
    /**
     * Hide the select list
     * @method hideSelectList
     * @private
     */
    hideSelectList() {
        var listNode;

        this.listVisible = false;

        if (this.listUlNode !== null) {
            listNode = this.listUlNode.parentNode;
            listNode.parentNode.removeChild(listNode);
            this.listUlNode = null;
        }
    }
    /**
     * Get values
     * @method getValues
     * @returns {Object} output
     */
    getValues() {
        var output = {};
        var n, l, key;

        output[this.property] = this.value;

        if (this.values instanceof Array) {
            for (n = 0, l = this.values.length; n < l; n++) {
                output[this.values[n]] = this.item[this.values[n]];
            }
        } else if (fw.isObject(this.values)) {
            for (key in this.values) {
                output[this.values[key]] = this.item[key];
            }
        }

        return output;
    }
    /**
     * Define the handler for the "blur" event
     * @method onLeave
     * @private
     */
    onLeave() {
        this.updateValue();
        this.focused = false;
        this.removeClass('focused');
        this.validate();
    }
    /**
     * Set the value from label for the SelectField
     * @method setValueFromLabel
     * @private
     * @param {string} label
     */
    setValueFromLabel(label) {
        var value = null;
        var labelOutput = '';
        var item = {};
        var n;

        if (!(this.labels instanceof Array)) {
            this.labels = [];
        }

        n = this.labels.indexOf(label);

        if (n === -1) {
            if (this.labels.length > 0) {
                labelOutput = this.labels[0];
                value = this.keys[0];
                item = this.nullable ? {} : this.options[0];
            }
        } else {
            labelOutput = label;
            value = this.keys[n];

            if (this.nullable) {
                if (n > 0) {
                    item = this.options[n - 1];
                }
            } else {
                item = this.options[n];
            }
        }

        this.currentLabel = this.selectInputNode.value = labelOutput;
        this.value = value;
        this.item = item;
    }
    /**
     * Set the value of the SelectField
     * @method setValue
     * @param {*} value
     */
    setValue(value) {
        var n;

        this.reset();
        n = this.keys.indexOf(value);

        if (n !== -1) {
            this.setValueFromLabel(this.labels[n]);
        } else {
            this.setValueFromLabel('');

            if (this.dataSource instanceof DataSource && this.sync) {
                this.dataSource.setValues(this.getValues());
                return;
            }
        }

        this.refreshDataSource();
    }
    /**
     * Clear the value of the SelectField
     * @method clear
     */
    clear() {
        this.value = null;
        this.item = {};
        this.selectInputNode.value = '';
        this.refreshDataSource();
    }
}

module.exports = FwSelectField;
