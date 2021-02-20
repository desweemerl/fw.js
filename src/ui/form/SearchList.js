/**
 * @module fw/ui/form/SearchList
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var CheckBox = require('./CheckBox');
var EditableFormElement = require('./EditableFormElement');
var fw = require('../../Core');
var FwElement = require('../Element');
var KeyboardManager = require('../KeyboardManager');
var SelectField = require('./SelectField');
var SearchField = require('./SearchField');
var TextField = require('./TextField');

/**
 * Create an UI search list field element
 * @class
 * @alias module:/fw/ui/form/SearchList
 * @augments fw/ui/form/EditableFormElement
 * @param {Object} [config] - the configuration object of the search list
 * @param {fw/source/DataSource} [config.dataSource]
 * @param {string} [config.property] - the search list datasource property
 * @param {Array} [config.filters] - filters that the search list can use
 * @param {function} [config.onSearch] - define an onSearch event function
 * @param {function} [config.onChange] - define an onChange event function
 */
class FwSearchList extends EditableFormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-searchlist'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-searchlist'; // jshint ignore:line   
    /**
     * Define element type
     * @property type
     */
    static type = 'object';
    /**
     * Activate one way binding
     * @property oneWayBinding
     */
    static oneWayBinding = true;
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */  
    initialize() {
        this.filterActivated = false;
        this.value = { filter: '' };
        this.filterPanelVisible = false;
        this.filtersActivated = {};
        this.filterNodes = [];
        this.filters = this.config.filters || [];
        this.onSearch = this.config.onSearch || null;
        this.onChange = this.config.onChange || null;
    }
    /**
     * Create the SearchList node
     * @method buildUI
     * @private
     */
    buildUI() {
        this.filterButtonNode = null;
        this.filterPanelNode = null;
        this.switchFilterButtonNode = null;
        this.closeFilterPanelNode = null;
        this.contentFilterPanelNode = null;

        if (this.filters.length > 0) {
            this.addClassName('full');
            this.node.innerHTML = '\
                <div class="fw-searchlist-parent">\
                    <div class="fw-searchlist-filter"><div><div></div></div></div>\
                    <div class="fw-searchlist-input"><input type="text" spellcheck="false"></input></div>\
                    <div class="fw-searchlist-search"><div><div></div></div></div>\
                </div>';
            this.filterButtonNode = this.node.getElementsByClassName('fw-searchlist-full-filter')[0];
            this.filterPanelNode = document.createElement('div');
            this.filterPanelNode.classList.add('fw-searchlist-panel');
            this.filterPanelNode.innerHTML = '\
                <div class="fw-searchlist-header">\
                    <div class="fw-searchlist-switch">\
                        <div class="fw-searchlist-button">\
                            <div class="fw-searchlist-on"></div>\
                            <div class="fw-searchlist-off"></div>\
                            <div class="fw-searchlist-cursor"></div>\
                        </div>\
                    </div>\
                    <div class="fw-searchlist-close"></div>\
                </div>\
                <div class="fw-searchlist-content"></div>\
                <div class="fw-searchlist-footer"></div>';
            this.switchFilterButtonNode = this.filterPanelNode.getElementsByClassName('fw-searchlist-button')[0];
            this.closeFilterPanelNode = this.filterPanelNode.getElementsByClassName('fw-searchlist-close')[0];
            this.contentFilterPanelNode = this.filterPanelNode.getElementsByClassName('fw-searchlist-content')[0];
            this.buildFilterPanel();
        } else {
            this.node.innerHTML = '\
                <div class="fw-searchlist-parent">\
                    <div class="fw-searchlist-input"><input type="text"></input></div>\
                    <div class="fw-searchlist-search"><div><div></div></div></div>\
                </div>';
        }

        this.searchListParentNode = this.node.getElementsByClassName('fw-searchlist-parent')[0];
        this.inputFieldNode = this.searchListParentNode.getElementsByTagName('input')[0];
        this.searchButtonNode = this.node.getElementsByClassName('fw-searchlist-search')[0];
        this.setFocusableNode(this.inputFieldNode);
    }
    /**
     * Build the filter panel
     * @method buildFilterPanel
     */
    buildFilterPanel() {
        var self = this;
        var n, l;
        var filter, tableNode, tbodyNode, trNode, tdNode, filterCheckBox, labelNode, filterElement;

        function onChangeFilter() {
            return function(node) {
                self.changeFilter(node);
            };
        }

        fw.emptyNode(this.contentFilterPanelNode);
        tableNode = document.createElement('table');
        tbodyNode = document.createElement('tbody');
        tableNode.appendChild(tbodyNode);

        for (n = 0, l = this.filters.length; n < l; n++) {
            filter = this.filters[n];

            if (fw.isString(filter.label) && fw.isString(filter.property)) {
                trNode = document.createElement('tr');
                tdNode = document.createElement('td');
                tdNode.classList.add('activateFilter');
                filterCheckBox = new CheckBox({ onChange: onChangeFilter(this.node.parentNode.parentNode.rowIndex) });
                tdNode.appendChild(filterCheckBox.node);
                trNode.appendChild(tdNode);
                tdNode = document.createElement('td');
                labelNode = document.createElement('span');
                labelNode.classList.add('label');
                labelNode.appendChild(document.createTextNode(this.createMessage(filter.label)));
                tdNode.appendChild(labelNode);
                trNode.appendChild(tdNode);

                switch (filter.type) {
                    case 'select':
                        filterElement = new SelectField(fw.copyObject(filter.options, { onChange: onChangeFilter(this.node.parentNode.parentNode.rowIndex) }));
                        break;
                    case 'search':
                        filterElement = new SearchField(fw.copyObject(filter.options, { onChange: onChangeFilter(this.node.parentNode.parentNode.rowIndex) }));
                        break;
                    default:
                        filterElement = new TextField(fw.copyObject(filter.options, { onChange: onChangeFilter(this.node.parentNode.parentNode.rowIndex) }));
                }

                tdNode = document.createElement('td');
                tdNode.appendChild(filterElement.node);
                trNode.appendChild(tdNode);
                tbodyNode.appendChild(trNode);
                this.filterNodes.push({
                    type: filter.type,
                    property: filter.property,
                    element: filterElement,
                    checkBox: filterCheckBox
                });
            }
        }

        this.contentFilterPanelNode.appendChild(tableNode);
    }
    /**
     * Bind all events to the SearchList node
     * @method bindUI
     * @private
     */
    bindUI() {
        super.bindUI();

        this.on('focus', this.onFocus);
        this.on('blur', this.onBlur);
        this.on('change',  this.onNodeChange);
        this.on('keydown', this.onKeyDown);
        this.on('mousedown', this.onMouseDown);
        this.on(['mouseup', 'mouseout'], this.deactivate);
        this.on('click', this.onClick);
    }
    /**
     * focus event handler
     * @method onFocus
     * @private
     */
    onFocus(e) { 
        if (this.searchListParentNode.contains(e.target)) {
            this.addClass('focused');
            this.focused = true;
        }
    }
    /**
     * blur event handler
     * @method onBlur
     * @private
     */
    onBlur(e) {
        if (this.searchListParentNode.contains(e.target)) {
            this.removeClass('focused');
            this.focused = false;
        }
    }   
    /**
     * change event handler
     * @method onChange
     * @private
     */
    onNodeChange(e) {
        if (this.inputFieldNode === e.target) {
            this.value.filter = this.inputFieldNode.value;
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
        if (this.inputFieldNode === e.target) {
            if (KeyboardManager.isActive('ENTER'))  {
                this.value.filter = this.inputFieldNode.value;
                this.refreshDataSource();

                if (fw.isFunction(this.onChange)) {
                    this.onChange();
                }

                if (fw.isFunction(this.onSearch)) {
                    this.onSearch();
                }

                e.preventDefault();
            }
        }
    }
    /**
     * mousedown event handler
     * @method onMouseDown
     * @private
     */
    onMouseDown(e) {
        if (e.target === this.inputFieldNode) return;

        if (this.searchListParentNode.contains(e.target)) {
            if (this.searchButtonNode.contains(e.target)) {
                this.searchButtonNode.classList.add('activated');
            } else if (this.filterButtonNode !== null) {
                if (this.filterButtonNode.contains(e.target)) {
                    this.filterButtonNode.classList.add('activated');
                }
            }

            if (this.focused) {
                this.value.filter = this.inputFieldNode.value;
                this.refreshDataSource();

                if (fw.isFunction(this.onChange)) {
                    this.onChange();
                }
            }

            this.inputFieldNode.focus();
            e.preventDefault();
        }
    }
    /**
     * mouseup and mouseout event handler
     * @method deactivate
     * @private
     */
    deactivate(e) {
        this.searchButtonNode.classList.remove('activated');

        if (this.filterButtonNode !== null) {
            this.filterButtonNode.classList.remove('activated');
        }
    }
    /**
     * click event handler
     * @method onClick
     * @private
     */
    onClick(e) {
        if (this.searchButtonNode.contains(e.target)) {
            if (fw.isFunction(this.onSearch)) {
                this.onSearch();
            }

            e.preventDefault();
        } else if (this.filterButtonNode !== null && this.filterButtonNode.contains(e.target)) {
            this.toggleFilterPanel();
            e.preventDefault();
        } else if (this.closeFilterPanelNode !== null && this.closeFilterPanelNode.contains(e.target)) {
            this.node.removeChild(this.filterPanelNode);
            this.filterPanelVisible = false;
            e.preventDefault();
        } else if (this.switchFilterButtonNode !== null && this.switchFilterButtonNode.contains(e.target)) {
            this.switchFilter();
            e.preventDefault();
        }
    }
    /**
     * Toggle filter panel display
     * @method toggleFilterPanel
     */
    toggleFilterPanel() {
        if (this.filterPanelVisible) {
            this.hideFilterPanel();
        } else {
            this.showFilterPanel();
        }
    }
    /**
     * Show the filter panel
     * @method showFilterPanel
     */
    showFilterPanel() {
        if (this.filterPanelNode === null) return;

        if (this.filterPanelNode.parentNode === null) {
            this.filterPanelNode.style.width = '';
            this.node.appendChild(this.filterPanelNode);

            if (this.filterPanelNode.offsetWidth < this.node.offsetWidth) {
                this.filterPanelNode.style.width = this.node.offsetWidth + 'px';
            }

            this.filterPanelNode.style.zIndex = this.getzIndex() + 2;
            this.filterPanelVisible = true;
        }
    }
    /**
     * Hide the filter panel
     * @method hideFilterPanel
     */
    hideFilterPanel() {
        if (this.filterPanelNode === null) return;

        if (this.filterPanelNode.parentNode !== null) {
            this.node.removeChild(this.filterPanelNode);
            this.filterPanelVisible = false;
        }
    }
    /**
     * Switch the filter
     * @method switchFilter
     */
    switchFilter() {
        this.activateFilter(!this.filterActivated);
    }
    /**
     * Activate the filter
     * @method activateFilter
     * @param {boolean} active
     */
    activateFilter(active) {
        var n, l;

        if (active && !this.filterActivated) {
            this.filterActivated = true;
            this.addClass('filter-on');
        } else if (!active && this.filterActivated) {
            this.filterActivated = false;
            this.removeClass('filter-on');
        } else {
            return;
        }

        for (n = 0, l = this.filterNodes.length; n < l; n++) {
            this.changeFilter(n);
        }
    }
    /**
     * Update the filter
     * @method changeFilter
     * @private
     * @param {number} index - index of the updated filter in filterNodes
     */
    changeFilter(index) {
        var filterNode = this.filterNodes[index];
        var subValue;

        if (filterNode) {
            if (filterNode.checkBox.getValue() && this.filterActivated) {
                switch (filterNode.type) {
                    case 'search':
                        subValue = filterNode.element.getValues()[filterNode.property];
                        break;
                    default:
                        subValue = filterNode.element.getValue();
                }
            } else {
                subValue = undefined;
            }

            this.value[filterNode.property] = subValue;
            this.refreshDataSource();

            if (fw.isFunction(this.onChange)) {
                this.onChange();
            }
        }
    }
    /**
     * Set the value of the SearchList
     * @method setValue
     * @param {Object} value
     */
    setValue(value) {
        var n, l, filterNode, subValue;

        this.value = value || {};
        this.value.filter = this.inputFieldNode.value = this.value.filter || '';

        for (n = 0, l = this.filterNodes.length; n < l; n++) {
            filterNode = this.filterNodes[n];
            subValue = this.value[filterNode.property];

            if (subValue === undefined) {
                filterNode.checkBox.setValue(false);
            } else {
                if (!this.filterActivated) {
                    this.filterActivated = true;
                    this.addClass('filter-on');
                }

                filterNode.checkBox.setValue(true);
            }

            switch (filterNode.type) {
                case 'search':
                    filterNode.element.setValue(subValue);
                    break;
                default:
                    filterNode.element.setValue(subValue);
            }

            this.refreshDataSource();
        }
    }
    /**
     * Clear the value of the SearchList
     * @method clear
     */
    clear() {
        var n, l, filterNode;

        this.value = {};
        this.value.filter = this.inputFieldNode.value = '';

        for (n = 0, l = this.filterNodes.length; n < l; n++) {
            filterNode = this.filterNodes[n];
            filterNode.checkBox.setValue(false);
            filterNode.element.setValue();
            this.refreshDataSource();
        }
    }
}

module.exports = FwSearchList;
