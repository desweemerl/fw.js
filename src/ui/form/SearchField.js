/**
 * @module fw/ui/form/SearchField
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var EditableFormElement = require('./EditableFormElement');
var fw = require('../../Core');
var KeyboardManager = require('../KeyboardManager');
var SearchSource = require('../../source/SearchSource');

var DEFAULT_MAX_LINES = 10;

/**
 * Create an UI search field element
 * @class
 * @alias module:/fw/ui/form/SearchField
 * @augments fw/ui/form/EditableFormElement
 * @param {Object} [config] - the configuration object of the search field
 * @param {fw/source/DataSource} [config.dataSource]
 * @param {string} [config.property] - the search field datasource property
 * @param {fw/source/SearchSource} [config.searchSource]
 * @param {string} [config.label] - value displayed
 * @param {Object|Array} [config.values] - dataSource values affected by an update
 * @param {boolean} [config.nullable] - set the search field nullable
 * @param {number} [config.maxLines=10] - set the max. number of lines displayed
 * @param {fw/ui/window/AddWindowModal} [config.addWindowModal] - add a link to an "add" window search dialog
 * @param {function} [config.onChange] - define an onChange event function
 * @param {boolean} [config.required] - mark the field as required
 * @param {fw/validator/RequiredValidator} [config.requiredValidator] - add a requiredValidator
 */
class FwSearchField extends EditableFormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-searchfield'; // jshint ignore:line
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
        this.labels = [];
        this.options = [];
        this.item = {};
        this.updated = false;
        this.focused = false;
        this.currentLabel = '';
        this.originalValue = null;
        this.originalItem = {};
        this.validationEnabled = true;
        this.listVisible = false;
        this.nodeOffset = { top: 0, left: 0 };

        this.label = this.config.label || null;
        this.values = this.config.values || null;
        this.nullable = this.config.nullable || false;
        this.maxLines = this.config.maxLines || DEFAULT_MAX_LINES;
        this.addWindowModal = this.config.addWindowModal || null;
        this.required = this.config.required || false;
        this.requiredValidator = this.config.requiredValidator || null;
        // Define a searchSource
        this.setSearchSource(this.config.searchSource || this.searchSource);
    }
    /**
     * Create the SearchField nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        if (this.addWindowModal) {
            this.addClassName('fw-searchfield-full');
            this.node.innerHTML = '\
                <div class="fw-searchfield-full-input">\
                    <input type="text" spellcheck="false"></input>\
                </div>\
                <div class="fw-searchfield-full-button"><div><div></div></div></div>';

            this.searchButtonNode = this.node.getElementsByClassName('fw-searchfield-full-button')[0];
        } else {
            this.addClassName('fw-searchField');
            this.node.innerHTML = '<input type="text" spellcheck="false"/>';
            this.searchInputNode = this.node.getElementsByTagName('input')[0];
        }

        this.searchInputNode = this.node.getElementsByTagName('input')[0];
        this.setFocusableNode(this.searchInputNode);
        this.listUlNode = null;
    }
    /**
     * Refresh the DataSource with values fetched by the SearchSource
     * @method refreshDataSource
     * @private
     */
    refreshDataSource() {
        if (this.dataSource && !this.sync) {
            this.dataSource.setValues(this.getValues());
        }
    }
    /**
     * Set the SearchSource
     * @method setSearchSource
     * @param {fw/source/SearchSource} searchSource - searchSource linked to the searchField
     */
    setSearchSource(searchSource) {
        if (this.searchSource !== searchSource) {
            if (this.searchSource instanceof SearchSource) {
                this.searchSource.unbind();
            }

            if (searchSource instanceof SearchSource) {
                this.searchSource.bind(this);
            } else {
                this.searchSource = null;
            }
        }
    }
    /**
     * Get the SearchSource
     * @method getSearchSource
     * @return {fw/source/SearchSource}
     */
    getSearchSource() {
        return this.fileUploadSource;
    }
    /**
     * Bind all events to the SearchField node
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

        this.onAttributeChange('label', this.setLabel);
        this.onAttributeChange('required', this.setRequired);
        this.onAttributeChange('nullable', this.setNullable);
        this.onAttributeChange('maxlines', this.setMaxLines);
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
            this.searchInputNode.focus();
            e.preventDefault();
        }
    }
    /**
     * mousedown event handler
     * @method onMouseDown
     * @private
     */
    onMouseDown(e) {
        var self = this;

        if (!this.focusable) {
            e.preventDefault();
            return;
        }

        if (this.searchButtonNode) {
            if (this.searchButtonNode.contains(e.target)) {
                this.searchButtonNode.classList.add('activated');
                this.searchInputNode.focus();
                e.preventDefault();

                if (e.which === 1 && fw.isFunction(this.addWindowModal)) {
                    if (this.addWindowModalInstance === undefined) {
                        this.addWindowModalInstance = new this.addWindowModal({
                            onBeforeHide: function() {
                                self.focused = true;
                                self.validationEnabled = true;
                            },
                            onAdd: function(item) {
                                self.setOptions(item.getObject());
                                self.searchInputNode.value = item.get(self.label);
                                self.updateValue();
                            }
                        });
                    }

                    this.validationEnabled = false;
                    this.addWindowModalInstance.show();
                }
            }
        }
    }
    /**
     * keyup event handler
     * @method onKeyUp
     * @private
     */
    onKeyUp(e) {
        if (!this.disabled && this.hasClass('focused')) {
            if (KeyboardManager.isActive('ENTER')) {
                this.updateValue();
            } else if (KeyboardManager.isActive(['CTRL', 'z'])) { 
                this.restoreValue();               
            } else if (
                !KeyboardManager.isActive('ARROW_UP') &&
                !KeyboardManager.isActive('ARROW_DOWN') &&
                !KeyboardManager.isActive('TAB')) {    
                this.showSearchList(this.searchInputNode.value);
            }
        }
    }
    /**
     * keydown event handler
     * @method onKeyUp
     * @private
     */
    onKeyDown(e) {
        var selected, selectedNext, selectedPrevious;

        if ((this.disabled && !KeyboardManager.isActive('TAB')) || KeyboardManager.isActive('ENTER') || KeyboardManager.isActive(['CTRL', 'z']))  {
            e.preventDefault();
        } else if (KeyboardManager.isActive('ARROW_UP')) {
            if (this.listUlNode !== null) {
                selected = this.listUlNode.getElementsByClassName('selected')[0];

                if (selected !== undefined) {
                    selected.classList.remove('selected');
                    selectedPrevious = selected.previousElementSibling === null ? this.listUlNode.lastElementChild : selected.previousElementSibling;
                    selectedPrevious.classList.add('selected');
                } else if (this.listUlNode.lastElementChild !== null) {
                    this.listUlNode.lastElementChild.classList.add('selected');
                }
            }
            e.preventDefault();
        } else if (KeyboardManager.isActive('ARROW_DOWN')) {
            if (this.listUlNode !== null) {
                selected = this.listUlNode.getElementsByClassName('selected')[0];

                if (selected !== undefined) {
                    selected.classList.remove('selected');
                    selectedNext = selected.nextElementSibling === null ? this.listUlNode.firstElementChild : selected.nextElementSibling;
                    selectedNext.classList.add('selected');
                } else if (this.listUlNode.firstElementChild !== null) {
                    this.listUlNode.firstElementChild.classList.add('selected');
                }
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
        if (this.searchButtonNode && this.searchButtonNode.contains(e.target)) {
            this.searchButtonNode.classList.remove('activated');
        }
    }
    /**
     * set SearchList label
     * @method setLabel
     * @param {string} label
     */
    setLabel(label) {
        this.label = fw.isEmptyString(label) ? null : label;
    }
    /**
     * Set the SearchField required
     * @method setRequired
     * @param {boolean|string} required
     */
    setRequired(required) {
        this.required = fw.isString(required) ? required === 'true' : !!required;
    }
    /**
     * Set the SearchField nullable
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
     * Set options to the SearchField
     * @method setOptions
     * @private
     * @param {Object|Array} options
     */
    setOptions(options) {
        var n, l;

        this.labels = this.nullable ? [''] : [];
        this.options = options instanceof Array ? options : [options];

        for (n = 0, l = this.options.length; n < l; n++) {
            this.labels.push(String(this.options[n][this.label]));
        }
    }
    /**
     * Backup the SearchField value
     * @method backupValue
     * @private
     */
    backupValue() {
        var n, l, key;

        this.originalValue = this.value;
        this.originalItem = {};

        if (this.dataSource) {
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
     * Restore the SearchField original value
     * @method restoreValue
     * @private
     */
    restoreValue() {
        this.value = this.originalValue;
        this.currentLabel = this.originalValue;
        this.searchInputNode.value = this.originalValue;

        if (this.updated) {
            this.item = this.originalItem;
            this.refreshDataSource();
            this.updated = false;
        }

        this.hideSearchList();
    }
    /**
     * Update the SearchField value
     * @method updateValue
     * @private
     */
    updateValue() {
        var modifyAllowed = true;
        var label = this.searchInputNode.value;
        var selected;

        if (this.searchSource instanceof SearchSource) {
            this.searchSource.abort();
        }

        if (this.listUlNode !== null) {
            selected = this.listUlNode.getElementsByClassName('selected')[0];

            if (selected !== undefined) {
                label = selected.classList.contains('empty') ? '' : selected.firstChild.textContent;
            }

            this.hideSearchList();
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

            if (this.searchSource instanceof SearchSource && fw.isFunction(this.searchSource.onChange)) {
                this.searchSource.onChange();
            }
        } else {
            this.restoreValue();
        }

        this.updated = true;
    }
    /**
     * Show the result of the search
     * @method showSearchList
     * @private
     * @param {string} filter - filter to be passed to the SearchSource
     */
    showSearchList(filter) {
        var self = this;

        if (this.searchSource instanceof SearchSource) {
            this.searchSource.load({ filter: filter })
            .then(function(response) {
                var items = response.data;
                var label = '';
                var truncateY, listNode, child, childHeight;
                var n, l;

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

                if (self.focused) {
                    self.setOptions(items);
                    l = self.labels.length;

                    if (l > 0) {
                        if (self.listUlNode === null) {
                            listNode = document.createElement('div');
                            listNode.style.top = 0;
                            listNode.style.left = 0;
                            listNode.style.height = 0;
                            listNode.style.width = 0;
                            listNode.classList.add('fw-seachfield-list');
                            self.listUlNode = document.createElement('ul');
                            self.listUlNode.classList.add('fw-searchfield-list-ul');
                            listNode.appendChild(self.listUlNode);
                            listNode.addEventListener('mouseover', function(listenerEvent) { self.onListMouseOver.call(self, listenerEvent); }, false);
                            listNode.addEventListener('mousedown', function(listenerEvent) { self.onListMouseDown.call(self, listenerEvent); }, false);
                            document.body.appendChild(listNode);
                        } else {
                            listNode = self.listUlNode.parentNode;
                            listNode.style.top = 0;
                            listNode.style.left = 0;
                            listNode.style.height = 0;
                            listNode.style.width = 0;
                            fw.emptyNode(self.listUlNode);
                        }

                        truncateY = l > self.maxLines;

                        for (n = 0; n < l; n++) {
                            label = self.labels[n];
                            child = document.createElement('li');
                            child.classList.add('fw-searchfield-list-li');

                            if (label === null ||
                                label.trim().length === 0) {
                                    child.classList.add('empty');
                                } else {
                                    child.appendChild(document.createTextNode(label));
                                }

                                self.listUlNode.appendChild(child);

                                if (n === 0) {
                                    if (truncateY) {
                                        self.listUlNode.style.overflowY = 'scroll';
                                        childHeight = child.offsetHeight;
                                    } else {
                                        self.listUlNode.style.overflowY = '';
                                    }
                                }
                        }

                        if (self.nullable) {
                            if (self.listUlNode.childNodes.length > 1) {
                                self.listUlNode.childNodes[1].classList.add('selected');
                            } else {
                                self.listUlNode.firstElementChild.classList.add('selected');
                            }
                        } else if (self.listUlNode.childNodes.length > 0) {
                            self.listUlNode.firstElementChild.classList.add('selected');
                        }

                        self.listVisible = true;
                        listNode.style.top = String(self.nodeOffset.top + self.node.offsetHeight) + 'px';
                        listNode.style.left = String(self.nodeOffset.left) + 'px';
                        self.listUlNode.style.height = truncateY ? String(childHeight * self.maxLines) + 'px' : '';
                        listNode.style.width = String(self.node.offsetWidth) + 'px';
                        listNode.style.zIndex = self.getzIndex() + 2;
                        listHandler();
                    } else {
                        self.hideSearchList();
                    }
                }
            });
        }
    }
    /**
     * Hide the result of the searh (searchList)
     * @method hideSearchList
     * @private
     */
    hideSearchList() {
        var listNode;

        this.listVisible = false;

        if (this.listUlNode !== null) {
            listNode = this.listUlNode.parentNode;
            listNode.parentNode.removeChild(listNode);
            this.listUlNode = null;
        }
    }
    /**
     * Get selected values
     * @method getValues
     * @private
     * @return {Object}
     */
    getValues() {
        var output = {},
            n, l, key;

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

        if (this.validationEnabled) {
            this.validate();
        }
    }
    /**
     * Set the value from label of the SearchField
     * @method setValueFromLabel
     * @private
     * @param {string} label
     */
    setValueFromLabel(label) {
        var item = {};
        var labelOutput = '';
        var n;

        if (!(this.labels instanceof Array)) {
            this.labels = [];
        }

        n = this.labels.indexOf(label);

        if (n !== -1) {
            labelOutput = label;
            item = this.options[n];
        }

        this.currentLabel = this.searchInputNode.value = labelOutput;
        this.value = labelOutput.length > 0 ? labelOutput : null;
        this.item = item;
    }
    /**
     * Set the value of the SearchField
     * @method setValue
     * @param {string|number} value
     */
    setValue(value) {
        this.reset();

        if (fw.isString(value)) {
            if (value.length > 0) {
                this.currentLabel = this.value = this.currentValue = this.searchInputNode.value = value;
                return;
            }
        } else if (fw.isValidNumber(value)) {
            this.currentLabel = this.value = this.searchInputNode.value = String(value);
            return;
        }

        this.currentLabel = this.searchInputNode.value = '';
        this.value = this.currentValue = null;
        this.item = {};
        this.refreshDataSource();
    }
    /**
     * Destroy the SearchField
     * @method destroy
     */
    destroy() {
        if (this.addWindowModalInstance) {
            this.addWindowModalInstance.destroy();
        }

        super.destroy();
    }
}

module.exports = FwSearchField;
