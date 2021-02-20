/**
 * @module fw/ui/grid/EditableDataGrid
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var ArraySource = require('../../source/ArraySource');
var ArrayElement = require('../ArrayElement');
var fw = require('../../Core');
var FwTimestamp = require('../../type/Timestamp');
var FwDate = require('../../type/Date');
var FwCurrency = require('../../type/Currency');
var FwNumber = require('../../type/Number');
var FwInteger = require('../../type/Integer');
var i18nGrid = require('../../nls/grid');
var i18nValidation = require('../../nls/validation');
var KeyboardManager = require('../KeyboardManager');
var Notification = require('../component/Notification');
var SearchSource = require('../../source/SearchSource');
var ValidatorFactory = require('../../validator/ValidatorFactory');

/**
 * @typedef Action
 * @param {string} value - set the value of the action
 * @return {function} [onClick] - define an onClick event function
 */
/**
 * @typedef Column
 * @param {string} [column.property] - define the column property
 * @param {string} [column.type] - define the column type ('currencyLabel', 'numberLabel', 'dateLabel', 'timestampLabel')
 * @param {number|string} [column.width=100] - define the column width
 * @param {Array.<Action>} [column.actions] - define list of actions
 */
/**
 * Create a DataGrid which uses the fw/source/ArraySource as model source
 * @class
 * @alias module:fw/ui/grid/EditableDataGrid
 * @augments fw/ui/ArrayElement
 * @param {Object} [config] - the configuration object of the editable datagrid
 * @param {fw/source/ArraySource} [config.arraySource] - attach an arraySource to the editable datagrid
 * @param {number} [config.size=10] - define the number rows displayed in the editable datagrid
 * @param {number|string} [config.width=100%] - define the editable datagrid width
 * @param {Array.<Column>} [config.columns] - define columns configuration
 * @param {function} [config.allowModify] - function(numRow, property, value) if defined, disable modification if returns false
 * @param {function} [config.onChange] - function() function called when value of the editable grid is updated
 */
class EditableDataGrid extends ArrayElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-editabledatagrid'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-editabledatagrid'; // jshint ignore:line
    /**
     * define the i18n dictionaries
     * @property i18n
     */
    static i18n = [i18nValidation, i18nGrid]; // jshint ignore:line
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */
    initialize() {
        super.initialize();

        var column, type;
        var n, l;

        this.resizable = false;
        this.focusable = false;
        this.enabled = false;
        this.minimumWidth = 0;
        this.invalidCells = {};
        this.mousedown = false;
        this.mouseStartX = null;
        this.numColResized = null;
        this.columnWidth = null;
        this.list = [];
        this.maxPages = 0;
        this.page = 0;

        this.addWindowModalInstances = {};

        this.columns = fw.copyArray(this.config.columns);
        this.width = this.config.width || '100%';
        this.size = this.config.size || 10;

        for (n = 0, l = this.columns.length; n < l; n++) {
            column = this.columns[n];
            switch (column.type) {
                case 'textInput':
                case 'searchInput':
                    type = 'string';
                    break;
                case 'numberInput':
                case 'numberLabel':
                    type = FwNumber;
                    break;
                case 'integerInput':
                case 'integerLabel':
                    type = FwInteger;
                    break;
                case 'currencyInput':
                case 'currencyLabel':
                    type = FwCurrency;
                    break;
                case 'checkboxInput':
                    type = 'boolean';
                    break;
                case 'timestampInput':
                case 'timestampLabel':
                    type = FwTimestamp;
                    break;
            }

            if (column.property) {
                this.addProperty(column.property, {
                    type:         type,
                    validators:   ValidatorFactory.getValidators(column),
                    defaultValue: column.defaultValue
                });
            }

            if (fw.isString(column.width)) {
                column.width = parseInt(column.width, 10);
            }

            if (column.type === 'selectInput') {
                this.setSelectOptions(column, column.options);
            }
        }

        if (this.config.onChange) {
            this.onChange = this.config.onChange;
        }

        if (this.config.allowModify) {
            this.allowModify = this.config.allowModify;
        }

        this.setArraySource(this.config.arraySource || this.arraySource);
    }
    /**
     * Set the ArraySource
     * @method setArraySource
     * @param {fw/source/ArraySource} arraySource - arraySource linked to the DataGrid
     */
    setArraySource(arraySource) {
        if (this.arraySource !== arraySource) {
            if (this.arraySource instanceof ArraySource) {
                this.arraySource.unbind();
            }

            if (arraySource instanceof ArraySource) {
                arraySource.bind(this);
            } else {
                this.arraySource = null;
            }
        }
    }
    /**
     * Get the ArraySource
     * @method getArraySource
     * @return {fw/source/ArraySource)
     */
    getArraySource() {
        return this.arraySource;
    }
    /**
     * Remove specified columns
     * @method removeColumns
     * @param {string|number|Array.<string>|Array.<number>} columns to be removed (can be defined by either column index or column name)
     */
    removeColumns(columns) {
        var self = this;
        var p, q;

        function removeColumn(column) {
            var numCol, n, l, i, j;

            if (fw.isString(column)) {
                for (n = 0, l = self.columns.length; n < l; n++) {
                    if (self.columns[n].name === column) {
                        numCol = n;
                        break;
                    }
                }
            } else if (fw.isValidNumber(column)) {
                numCol = column;
            }

            if (numCol === undefined) return;

            if (numCol > l - 1) {
                numCol = l - 1;
            } else if (numCol < 0) {
                numCol = 0;
            }

            for (i = 0, j = self.list.length; i < j; i++) {
                if (self.invalidCells[i] !== undefined) {
                    if (self.invalidCells[i][numCol] !== undefined) {
                        delete self.invalidCells[i][numCol];
                    }

                    for (n = numCol + 1; n < l; n++) {
                        if (self.invalidCells[i][n] !== undefined) {
                            self.invalidCells[i][n - 1] = self.invalidCells[i][n];
                            delete self.invalidCells[i][n];
                        }
                    }
                }
            }

            self.minimumWidth -= self.columns[numCol].width;
            self.columns.splice(numCol, 1);
        }

        if (!(columns instanceof Array)) {
            columns = [columns];
        }

        for (p = 0, q = columns.length; p < q; p++) {
            removeColumn(columns[p]);
        }

        this.buildHeader();
        this.buildBody();
        this.buildFooter();
    }
    /**
     * Insert column(s)
     * @method insertColumns
     * @param {string|index|Array.<{name: string, column: Column}>|Array.<{index: number, column: Column}>} arg1 - column name or column index or list of column options
     * @param {Column} [arg2] - column options if column name or column index is defined in arg1
     */
    insertColumns() {
        var self = this;
        var p, q, params;

        function insertColumn(param) {
            var numCol, n, l, i, j;

            param = param || {};

            if (!fw.isObject(param.column)) return;

            if (fw.isString(param.name)) {
                for (n = 0, l = self.columns.length; n < l; n++) {
                    if (self.columns[n].name === param.name) {
                        numCol = n;
                        break;
                    }
                }
            } else if (fw.isValidNumber(param.index)) {
                numCol = param.index;
            }

            if (numCol === undefined) return;

            if (fw.isString(param.column.name)) {
                for (n = 0; n < l; n++) {
                    if (self.columns[n].name === param.column.name) {
                        return;
                    }
                }
            }

            if (numCol > l - 1) {
                numCol = l - 1;
            } else if (numCol < 0) {
                numCol = 0;
            }

            for (i = 0, j = self.list.length; i < j; i++) {
                if (self.invalidCells[i] !== undefined) {
                    for (n = numCol; n < l; n++) {
                        if (self.invalidCells[i][n] !== undefined) {
                            self.invalidCells[i][n + 1] = self.invalidCells[i][n];
                            delete self.invalidCells[i][n];
                        }
                    }
                }
            }

            if (fw.isString(param.column.width)) {
                param.column.width = parseInt(param.column.width, 10);
            }

            if (param.column.type === 'selectInput') {
                self.setSelectOptions(param.column, param.column.options);
            }

            self.minimumWidth += param.column.width;
            self.columns.splice(numCol, 0, param.column);
        }

        if (arguments.length === 1) {
            if (arguments[0] instanceof Array) {
                params = arguments[0];
            }
        } else if (arguments.length === 2) {
            if (fw.isString(arguments[0])) {
                params = [{ name: arguments[0], column: arguments[1] }];
            } else if (fw.isValidNumber(arguments[0])) {
                params = [{ index: arguments[0], column: arguments[1] }];
            } else {
                return;
            }
        } else {
            return;
        }

        for (p = 0, q = params.length; p < q; p++) {
            insertColumn(params[p]);
        }

        this.buildHeader();
        this.buildBody();
        this.buildFooter();
    }
    /**
     * Append column(s)
     * @method appendColumns
     * @param {string|index|Array.<{name: string, column: Column}>|Array.<{index: number, column: Column}>} arg1 - column name or column index or list of column options
     * @param {Column} [arg2] - column options if column name or column index is defined in arg1
     */
    appendColumns(columns) {
        var self = this;
        var p, q;

        function appendColumn(column) {
            if (!fw.isObject(column)) return;

            var n, l;

            if (fw.isString(column.name)) {
                for (n = 0, l = self.columns.length; n < l; n++) {
                    if (self.columns[n].name === column.name) {
                        return;
                    }
                }
            }

            if (fw.isString(column.width)) {
                column.width = parseInt(column.width, 10);
            }

            if (column.type === 'selectInput') {
                self.setSelectOptions(column, column.options);
            }

            self.minimumWidth += column.width;
            self.columns.push(column);
        }

        if (!(columns instanceof Array)) {
            columns = [columns];
        }

        for (p = 0, q = columns.length; p < q; p++) {
            appendColumn(columns[p]);
        }

        this.buildHeader();
        this.buildBody();
        this.buildFooter();
    }
    /**
     * Disable column(s)
     * @method setDisabled
     * @param {string|Object.<string, boolean>}} arg1 - property or dict of properties - disabled parameters
     * @param {boolean} [arg2] - disabled parameter if property is defined in arg1
     */
    setDisabled() {
        var self = this;
        var key, obj;

        function setDisabledByProperty(property, disabled) {
            var found = false;
            var column, i, j, n, l, rowNode, cell, parentNode, firstNode;

            for (n = 0, l = self.columns.length; n < l; n++) {
                column = self.columns[n];

                if (column.property === property) {
                    column.disabled = disabled;
                    found = true;
                    break;
                }
            }

            if (!found) return;

            for (i = 0, j = self.bodyNode.childNodes.length; i < j; i++) {
                rowNode = self.bodyNode.childNodes[i];
                cell = rowNode.childNodes[n];

                if (cell !== undefined) {
                    parentNode = cell.firstElementChild;

                    if (parentNode !== null) {
                        firstNode = parentNode.firstElementChild;

                        if (firstNode !== null) {
                            if (disabled) {
                                parentNode.classList.add('disabled');
                            } else {
                                parentNode.classList.remove('disabled');
                            }

                            switch (column.type) {
                                case 'textInput':
                                case 'numberInput':
                                case 'integerInput':
                                case 'currencyInput':
                                    firstNode.disabled = disabled;
                                    break;
                                case 'checkBoxInput':
                                    if (disabled) {
                                        firstNode.removeAttribute('tabindex');
                                    } else {
                                        firstNode.setAttribute('tabindex', 0);
                                    }
                                    break;
                                case 'selectInput':
                                case 'searchInput':
                                    firstNode.firstElementChild.disabled = disabled;
                                    break;
                                case 'timestampInput':
                                    parentNode.childNodes[0].firstElementChild.disabled = disabled;
                                    parentNode.childNodes[1].firstElementChild.disabled = disabled;
                                    break;
                            }
                        }
                    }
                }
            }
        }

        if (arguments.length === 1) {
            obj = arguments[0];

            if (fw.isObject(obj)) {
                for (key in obj) {
                    setDisabledByProperty(key, obj[key]);
                }
            }
        } else if (arguments.length === 2) {
            setDisabledByProperty(arguments[0], arguments[1]);
        }
    }
    /**
     * Destroy the EditableDateGrid
     * @method destroy
     */
    destroy() {
        var numCol;

        for (numCol in this.addWindowModalInstances) {
            this.addWindowModalInstances[numCol].destroy();
        }

        super.destroy();
    }
    /**
     * Create the EditableDataGrid nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node.style.width = this.width;
        this.node.innerHTML = '\
            <div class="fw-editabledatagrid-content">\
                <div class="fw-editabledatagrid-frame">\
                    <table>\
                        <thead></thead>\
                        <tbody></tbody>\
                    </table>\
                </div>\
                <div class="fw-editabledatagrid-scroll"></div>\
            </div>\
            <div class="fw-editabledatagrid-footer"></div>';
        this.contentNode = this.node.getElementsByClassName('fw-editabledatagrid-content')[0];
        this.frameNode = this.contentNode.getElementsByClassName('fw-editabledatagrid-frame')[0];
        this.tableNode = this.contentNode.getElementsByTagName('table')[0];
        this.headerNode = this.contentNode.getElementsByTagName('thead')[0];
        this.bodyNode = this.contentNode.getElementsByTagName('tbody')[0];
        this.footerNode = this.node.getElementsByClassName('fw-editabledatagrid-footer')[0];
        this.scrollSpacer = this.node.getElementsByClassName('fw-editabledatagrid-scroll')[0];

        this.selectList = document.createElement('div');
        this.selectList.classList.add('fw-editabledatagrid-list');
        this.selectListUl = document.createElement('ul');
        this.selectListUl.classList.add('fw-editabledatagrid-list-ul');
        this.selectList.appendChild(this.selectListUl);
        this.searchList = document.createElement('div');
        this.searchList.classList.add('fw-editabledatagrid-list');
        this.searchListUl = document.createElement('ul');
        this.searchListUl.classList.add('fw-editabledatagrid-list-ul');
        this.searchList.appendChild(this.searchListUl);

        this.calculateColumnWidths();
        this.buildHeader();
        this.buildBody();
        this.buildFooter();
    }
    /**
     * Calculate the column width
     * @method calculateColumnWidths
     * @private
     */
    calculateColumnWidths() {
        var column, n, l;

        this.minimumWidth = 0;

        for (n = 0, l = this.columns.length; n < l; n++) {
            column = this.columns[n];

            if (column.width) {
                this.minimumWidth += column.width;
            } else {
                column.width = 100;
                this.minimumWidth += 100;
            }
        }
    }
    /**
     * Resize a column
     * @method resizeColumn
     * @private
     * @param {number} numCol - the column index to be resized
     * @param {number} delta - the delta applied to the column width
     */
    resizeColumn(numCol, delta) {
        var column = this.columns[numCol];
        var th = this.headerNode.getElementsByTagName('th')[numCol];
        var width;

        if (this.columnWidth === null) {
            this.columnWidth = column.width;
        }

        width = this.columnWidth + delta;

        if (width < 5) {
            width = 5;
        }

        column.width = width;
        th.style.width = width + 'px';
    }
    /**
     * Repaint the EditableDataGrid
     * @method repaint
     */
    repaint() {
        var frameHeight = this.frameNode.clientHeight;
        var scrollHeight;

        if (this.isAttached && this.frameHeight !== frameHeight) {
            this.frameHeight = frameHeight;
            this.node.style.width = this.width;

            this.frameNode.style.visibility = 'hidden';
            this.frameNode.style.width = this.width;
            this.frameNode.style.overflowX = 'scroll';

            this.contentNode.style.height = this.frameNode.offsetHeight + 'px';
            scrollHeight = this.frameNode.offsetHeight;
            this.frameNode.style.overflowX = 'hidden';
            scrollHeight -= this.frameNode.offsetHeight;
            this.scrollSpacer.style.top = this.frameNode.offsetHeight + 'px';
            this.scrollSpacer.style.height = scrollHeight + 'px';

            this.frameNode.style.zIndex = this.getzIndex() + 1;
            this.frameNode.style.overflowX = 'auto';
            this.frameNode.style.visibility = '';

            this.emitEvent('repaint', this.node);
        }
    }
    /**
     * Display cell error
     * @method displayError
     * @private
     * @param {Node} cellNode - cell node that get the error
     */
    displayError(cellNode) {
        if (this.invalidCells[cellNode.fwCell.index] !== undefined) {
            if (this.invalidCells[cellNode.fwCell.index][cellNode.fwCell.numCol] !== undefined) {
                Notification.show({
                    error: true,
                    message: this.invalidCells[cellNode.fwCell.index][cellNode.fwCell.numCol]
                });
            }
        }
    }
    /**
     * Initilize cell node
     * @method initCellNodeByChild
     * @private
     * @param {Node} childNode - node from which we want to initialize its cell node
     * @return {Node} cellNode
     */
    initCellNodeByChild(childNode) {
        if (!this.node.contains(childNode)) return;

        var node = null;
        var type, column, frameNode, inputNode, inputNodes, buttonNode, n, l;

        if (childNode.classList.contains('fw-editabledatagrid-empty')) {
            return null;
        } else if (childNode.parentNode.classList.contains('fw-editabledatagrid-selectfield')) {
            node = childNode.parentNode.parentNode;
            buttonNode = node.getElementsByClassName('fw-editabledatagrid-selectfield-button')[0];
            inputNode = childNode;
        } else if (childNode.parentNode.parentNode.classList.contains('fw-editabledatagrid-selectfield-button')) {
            buttonNode = childNode.parentNode.parentNode;
            node = buttonNode.parentNode;
            inputNode = node.getElementsByTagName('input')[0];
        } else if (childNode.parentNode.classList.contains('fw-editabledatagrid-searchfield-full')) {
            node = childNode.parentNode.parentNode;
            buttonNode = node.getElementsByClassName('fw-editabledatagrid-searchfield-full-button')[0];
            inputNode = childNode;
        } else if (childNode.parentNode.classList.contains('fw-editabledatagrid-searchfield')) {
            node = childNode.parentNode;
            inputNode = childNode;
        } else if (childNode.parentNode.parentNode.classList.contains('fw-editabledatagrid-searchfield-full-button')) {
            buttonNode = childNode.parentNode.parentNode;
            node = buttonNode.parentNode;
            inputNode = node.getElementsByTagName('input')[0];
        } else if (childNode.parentNode.classList.contains('fw-editabledatagrid-timestampfield-date') {
            node = childNode.parentNode.parentNode;
            inputNodes = node.getElementsByTagName('input');
        } else if (childNode.parentNode.classList.contains('fw-editabledatagrid-timestampfield-time')) {
            node = childNode.parentNode.parentNode;
            inputNodes = node.getElementsByTagName('input');
        } else if (childNode.classList.contains('fw-editabledatagrid-textfield') || childNode.classList.contains('fw-editabledatagrid-numberfield') || childNode.classList.contains('fw-editabledatagrid-integerfield') || childNode.classList.contains('fw-editabledatagrid-currencyfield')) {
            node = childNode.parentNode;
            inputNode = childNode;
        } else if (childNode.parentNode.classList.contains('fw-editabledatagrid-checkbox')) {
            node = childNode.parentNode;
            frameNode = childNode;
        }

        if (node !== null) {
            if (node.fwCell === undefined) {
                node.fwCell = {};
                node.fwCell.numCol = node.parentNode.cellIndex;
                node.fwCell.numRow = node.parentNode.parentNode.rowIndex - 1;
                node.fwCell.index = ((this.page - 1) * this.size) + node.fwCell.numRow;
                column = node.fwCell.column = this.columns[node.fwCell.numCol];
                type = node.fwCell.type = column.type;
                node.fwCell.property = column.property;
                node.fwCell.disabled = fw.isBoolean(column.disabled) ? column.disabled : false;

                if (type === 'searchInput') {
                    node.fwCell.searchSource = column.searchSource;
                    node.fwCell.addWindowModal = column.addWindowModal;
                    node.fwCell.listUlNode = null;
                    node.fwCell.maxLines = column.maxLines || 10;
                } else if (type === 'selectInput') {
                    node.fwCell.listUlNode = null;
                    node.fwCell.maxLines = column.maxLines || 10;
                }

                node.fwCell.inputNode = inputNode;
                node.fwCell.inputNodes = inputNodes;
                node.fwCell.buttonNode = buttonNode;
                node.fwCell.frameNode = frameNode;
                node.fwCell.validationEnabled = true;
                node.fwData = {};

                this.resetCellNode(node);

                if (inputNode !== undefined)  { inputNode.fwCellNode = node; }
                if (buttonNode !== undefined) { buttonNode.fwCellNode = node; }
                if (frameNode !== undefined)  { frameNode.fwCellNode = node; }
                if (inputNodes !== undefined) {
                    for (n = 0, l = inputNodes.length; n < l; n++) {
                        inputNode = inputNodes[n];
                        inputNode.fwCellNode = node;
                    }
                }
            }
        }

        return node;
    }
    /**
     * Return cell node from a child node
     * @method getCellNodeByChild
     * @private
     * @param {Node} childNode - node from which we want to retrieve its cell node
     * @return {Node} cellNode
     */
    getCellNodeByChild(childNode) {
        return childNode.fwCellNode === undefined ? this.initCellNodeByChild(childNode) : childNode.fwCellNode;
    }
    /**
     * Reset a cell node
     * @method resetCellNode
     * @private
     * @param {Node} cellNode - cell node to be reset
     */
    resetCellNode(cellNode) {
        if (!(this.arraySource instanceof ArraySource)) return;

        var type, index, property, column, inputNodes, values, originalItem, key, n, l;

        if (cellNode.fwData !== undefined) {
            type = cellNode.fwCell.type;
            index = cellNode.fwCell.index;
            property = cellNode.fwCell.property;
            column = cellNode.fwCell.column;
            cellNode.fwData.updated = false;
            cellNode.fwData.originalValue = this.arraySource.source.get(index).get(property);

            switch (type) {
                case 'timestampInput':
                    inputNodes = cellNode.fwCell.inputNodes;
                    cellNode.fwData.originalValue = [inputNodes[0].value, inputNodes[1].value];
                    break;
                case 'checkboxInput':
                    cellNode.fwData.currentLabel = cellNode.fwData.originalValue = cellNode.classList.contains('checked');
                    break;
                case 'selectInput':
                case 'searchInput':
                    cellNode.fwData.currentLabel = cellNode.fwData.originalValue = cellNode.fwCell.inputNode.value;
                    cellNode.fwData.item = {};
                    cellNode.fwData.labels = [];
                    cellNode.fwData.options = [];
                    cellNode.fwData.listVisible = false;
                    cellNode.fwData.nodeOffset = { top: 0, left: 0 };
                    values = cellNode.fwData.values = column.values;
                    originalItem = {};

                    if (values instanceof Array) {
                        for (n = 0, l = values.length; n < l; n++) {
                            key = values[n];
                            originalItem[key] = this.arraySource.get(index).get(key);
                        }
                    } else if (fw.isObject(values)) {
                        for (key in values) {
                            originalItem[key] = this.arraySource.get(index).get(values[key]);
                        }
                    }

                    cellNode.fwData.originalItem = originalItem;
                    break;
                default:
                    cellNode.fwData.originalValue = cellNode.fwCell.inputNode.value;
            }
        }
    }
    /**
     * Set the focus on a cell node from its child bode
     * @method setFocusOnCellByChild
     * @private
     * @param {Node} childNode
     * @return {Node} cellNode
     */
    setFocusOnCellByChild(childNode) {
        var cellNode = this.getCellNodeByChild(childNode);

        if (cellNode !== null) {
            if (cellNode.fwCell.type === 'timestampInput') {
                if (childNode.parentNode.classList.contains('fw-editabledatagrid-timestampfield-date')) {
                    cellNode.fwData.inputFocused = 'date';
                    cellNode.classList.remove('timeInputFocused');
                    cellNode.classList.add('dateInputFocused');
                } else {
                    cellNode.fwData.inputFocused = 'time';
                    cellNode.classList.add('timeInputFocused');
                    cellNode.classList.remove('dateInputFocused');
                }

                if (!cellNode.fwData.insideFocus) {
                    cellNode.fwData.focused = true;
                    this.resetCellNode(cellNode);
                    this.displayError(cellNode);
                } else {
                    cellNode.fwData.insideFocus = false;
                }
            } else {
                if (!cellNode.fwData.focused) {
                    cellNode.fwData.focused = true;
                    this.resetCellNode(cellNode);
                    this.displayError(cellNode);
                }

                cellNode.classList.add('focused');
            }
        }

        return cellNode;
    }
    /**
     * Restore cell node to its original content
     * @method restoreCellNode
     * @param {Node} cellNode
     */
    restoreCellNode(cellNode) {
        var originalValue = cellNode.fwData.originalValue;

        cellNode.fwData.value = cellNode.fwData.originalValue;

        switch (cellNode.fwCell.type) {
            case 'timestampInput':
                cellNode.fwCell.inputNodes[0].value = originalValue[0];
                cellNode.fwCell.inputNodes[1].value = originalValue[1];
                break;
            case 'checkboxInput':
                if (originalValue) {
                    cellNode.classList.add('checked');
                } else {
                    cellNode.classList.remove('checked');
                }
                cellNode.fwData.currentLabel = originalValue;
                break;
            case 'selectInput':
            case 'searchInput':
                cellNode.fwCell.inputNode.value = originalValue;
                cellNode.fwData.item = cellNode.fwData.originalItem;
                cellNode.fwData.currentLabel = originalValue;
                this.hideList(cellNode);
                break;
            default:
                cellNode.fwCell.inputNode.value = originalValue;
        }

        if (cellNode.fwData.updated) {
            this.refreshGridSource(cellNode);
            cellNode.fwData.updated = false;
        }
    }
    /**
     * Set select options
     * @method setSelectOptions
     * @private
     * @param {Column} column
     * @param {Array.<Object>} options
     */
    setSelectOptions(column, options) {
        var option, n, l;

        if (!(options instanceof Array)) {
            options = [options];
        }

        if (column.nullable) {
            column.selectLabels = [''];
            column.selectKeys = [null];
        } else {
            column.selectLabels = [];
            column.selectKeys = [];
        }

        for (n = 0, l = options.length; n < l; n++) {
            option = options[n];
            column.selectKeys.push(option[column.key]);
            column.selectLabels.push(String(option[column.label]));
        }

        if (l > 0) {
            column.defaultValue = column.selectKeys[0];
        }
    }
    /**
     * Reset cell node error
     * @method resetCellNodeError
     * @private
     */
    resetCellNodeError(cellNode) {
        if (this.invalidCells[cellNode.fwCell.index] !== undefined) {
            if (this.invalidCells[cellNode.fwCell.index][cellNode.fwCell.numCol] !== undefined) {
                cellNode.classList.remove('invalid');
                delete this.invalidCells[cellNode.fwCell.index][cellNode.fwCell.numCol];
            }
        }
    }
    /**
     * Refresh the DataSource for select and search inputs
     * @method refreshGridSource
     * @private
     * @param {Node} cellNode
     */
    refreshGridSource(cellNode) {
        if (!(this.arraySource instanceof ArraySource)) return;

        var index = cellNode.fwCell.index;
        var type = cellNode.fwCell.type;
        var output = {};
        var item, values, key, n, l;

        output[cellNode.fwCell.property] = cellNode.fwData.value;

        if (type === 'selectInput' || type === 'searchInput') {
            item = cellNode.fwData.item || {};
            values = cellNode.fwData.values;

            if (values instanceof Array) {
                for (n = 0, l = values.length; n < l; n++) {
                    output[values[n]] = item[values[n]];
                }
            } else if (fw.isObject(values)) {
                for (key in values) {
                    output[values[key]] = item[key];
                }
            }
        }

        this.arraySource.source.get(index).setValues(output);
    }
    /**
     * Update a cell node
     * @method updateCellNode
     * @private
     * @param {Node} cellNode
     */
    updateCellNode(cellNode) {
        var modifyAllowed = true;
        var input, dateInput, timeInput, listUlNode, selected, label, value, searchSource;

        switch (cellNode.fwCell.type) {
            case 'textInput':
                value = cellNode.fwCell.inputNode.value.trim();
                cellNode.fwCell.inputNode.value = value;

                if (value.length === 0) {
                    value = null;
                }

                if (cellNode.fwData.originalValue === value) return;
                break;
            case 'numberInput':
                input = cellNode.fwCell.inputNode.value.trim();
                value = new FwNumber(input);

                if (input.length > 0 && value.isNull()) {
                    this.restoreCellNode(cellNode);
                    return;
                }

                cellNode.fwCell.inputNode.value = value.toString();
                if (cellNode.fwData.originalValue.equals(value)) return;
                break;
            case 'integerInput':
                input = cellNode.fwCell.inputNode.value.trim();
                value = new FwInteger(input);

                if (input.length > 0 && value.isNull()) {
                    this.restoreCellNode(cellNode);
                    return;
                }

                cellNode.fwCell.inputNode.value = value.toString();
                if (cellNode.fwData.originalValue.equals(value)) return;
                break;
            case 'currencyInput':
                input = cellNode.fwCell.inputNode.value.trim();
                value = new FwCurrency(input);

                if (input.length > 0 && value.isNull()) {
                    this.restoreCellNode(cellNode);
                    return;
                }

                cellNode.fwCell.inputNode.value = value.toString();
                if (cellNode.fwData.originalValue.equals(value)) return;
                break;
            case 'timestampInput':
                dateInput = cellNode.fwCell.inputNodes[0].value.trim();
                timeInput = cellNode.fwCell.inputNodes[1].value.trim();
                value = new FwTimestamp({ date: dateInput, time: timeInput });

                if ((dateInput.length > 0 || timeInput.length > 0) && value.isNull()) {
                    this.restoreCellNode(cellNode);
                    return;
                }

                cellNode.fwCell.inputNodes[0].value = value.toDMYString();
                cellNode.fwCell.inputNodes[1].value = value.toHMSString();
                if (cellNode.fwData.originalValue.equals(value)) return;
                break;
            case 'checkboxInput':
                value = cellNode.classList.contains('checked');
                if (cellNode.fwData.currentLabel === value) return;
                cellNode.fwData.currentLabel = value;
                break;
            case 'selectInput':
                label = cellNode.fwCell.inputNode.value;
                listUlNode = cellNode.fwCell.listUlNode;

                if (listUlNode !== null) {
                    selected = listUlNode.getElementsByClassName('selected')[0];

                    if (selected !== undefined) {
                        label = selected.classList.contains('empty') ? '' : selected.firstChild.textContent;
                    }

                    this.hideList(cellNode);
                } else if (label === cellNode.fwData.currentLabel) {
                    return;
                }

                this.setSelectLabel(cellNode, label);
                value = cellNode.fwData.value;
                break;
            case 'searchInput':
                label = cellNode.fwCell.inputNode.value;
                searchSource = cellNode.fwCell.searchSource;

                if (searchSource instanceof SearchSource) {
                    searchSource.abort();
                }

                listUlNode = cellNode.fwCell.listUlNode;

                if (listUlNode !== null) {
                    if ((selected = listUlNode.getElementsByClassName('selected')[0]) !== undefined) {
                        label = selected.classList.contains('empty') ? '' : selected.firstChild.textContent;
                    }

                    this.hideList(cellNode);
                } else if (label === cellNode.fwData.currentLabel) {
                    return;
                }

                this.setSearchLabel(cellNode, label);
                value = cellNode.fwData.value;
                break;
        }

        if (fw.isFunction(this.allowModify) && !fw.isBoolean(modifyAllowed = this.allowModify(cellNode.fwCell.numRow, cellNode.fwCell.property, value))) {
            modifyAllowed = true;
        }

        if (modifyAllowed) {
            cellNode.fwData.value = value;
            this.refreshGridSource(cellNode);

            if (fw.isFunction(this.onChange)) {
                this.onChange();
            }

            if (searchSource instanceof SearchSource && fw.isFunction(searchSource.onChange)) {
                this.searchSource.onChange();
            }

            cellNode.fwData.updated = true;
        } else {
            this.restoreCellNode(cellNode);
        }
    }
    /**
     * Set a label for select input node
     * @method setSelectLabel
     * @private
     * @param {Node} cellNode
     * @param {string} label
     */
    setSelectLabel(cellNode, label) {
        var value = null;
        var labelOutput = '';
        var item = {};
        var column, n;

        if (cellNode.fwCell.type === 'selectInput') {
            column = cellNode.fwCell.column;

            if (!(column.selectLabels instanceof Array)) {
                column.selectLabels = [];
            }

            n = column.selectLabels.indexOf(label);

            if (n === -1) {
                if (column.selectLabels.length > 0) {
                    labelOutput = column.selectLabels[0];
                    value = column.selectKeys[0];
                    item = column.nullable ? {} : column.options[0];
                }
            } else {
                labelOutput = label;
                value = column.selectKeys[n];
                if (column.nullable) {
                    if (n > 0) {
                        item = column.options[n - 1];
                    }
                } else {
                    item = column.options[n];
                }
            }

            cellNode.fwData.currentLabel = cellNode.fwCell.inputNode.value = labelOutput;
            cellNode.fwData.value = value;
            cellNode.fwData.item = item;
        }
    }
    /**
     * Show a select list
     * @method showSelectList
     * @private
     * @param {Node} cellNode
     * @param {string} filter
     */
    showSelectList(cellNode, filter) {
        var self = this;
        var labels = [];
        var truncateY, column, child, childHeight, filterLowerCase, listUlNode, listNode, label, n, l;

        function listHandler() {
            var currentOffset = fw.getOffset(cellNode);

            if (cellNode.fwData.nodeOffset.top !== currentOffset.top) {
                cellNode.fwData.nodeOffset.top = currentOffset.top;
                listNode.style.top = String(cellNode.fwData.nodeOffset.top + cellNode.offsetHeight) + 'px';
            }

            if (cellNode.fwData.nodeOffset.left !== currentOffset.left) {
                cellNode.fwData.nodeOffset.left = currentOffset.left;
                listNode.style.left = String(cellNode.fwData.nodeOffset.left) + 'px';
            }

            if (cellNode.fwData.listVisible) {
                window.setTimeout(listHandler, 1);
            }
        }

        if (cellNode.fwCell.type === 'selectInput') {
            column = cellNode.fwCell.column;

            if (filter) {
                filterLowerCase = filter.toLowerCase();

                if (column.nullable) {
                    labels.push('');
                }

                for (n = 0, l = column.selectLabels.length; n < l; n++) {
                    label = column.selectLabels[n];

                    if (label.toLowerCase().indexOf(filterLowerCase) === 0) {
                        labels.push(label);
                    }
                }
            } else {
                labels = column.selectLabels;
            }

            l = labels.length;

            if (l > 0) {
                listUlNode = cellNode.fwCell.listUlNode;

                if (listUlNode === null) {
                    listNode = document.createElement('div');
                    listNode.style.top = 0;
                    listNode.style.left = 0;
                    listNode.style.height = 0;
                    listNode.style.width = 0;
                    listNode.classList.add('fw-editabledatagrid-list');
                    listUlNode = document.createElement('ul');
                    listNode.appendChild(listUlNode);
                    listNode.addEventListener('mouseover', function(listenerEvent) { self.onListMouseOver.call(self, listenerEvent); }, false);
                    listNode.addEventListener('mousedown', function(listenerEvent) { self.onListMouseDown.call(self, listenerEvent); }, false);
                    document.body.appendChild(listNode);
                    cellNode.fwCell.listUlNode = listUlNode;
                    listUlNode.fwCellNode = cellNode;
                } else {
                    listNode = listUlNode.parentNode;
                    listNode.style.top = 0;
                    listNode.style.left = 0;
                    listNode.style.height = 0;
                    listNode.style.width = 0;
                    fw.emptyNode(listUlNode);
                }

                truncateY = l > cellNode.fwCell.maxLines;

                for (n = 0; n < l; n++) {
                    label = labels[n];
                    child = document.createElement('li');

                    if (label === null || label.trim().length === 0) {
                        child.classList.add('empty');
                    } else {
                        child.appendChild(document.createTextNode(label));
                    }

                    listUlNode.appendChild(child);

                    if (n === 0) {
                        if (truncateY) {
                            listUlNode.style.overflowY = 'scroll';
                            childHeight = child.offsetHeight;
                        } else {
                            listUlNode.style.overflowY = '';
                        }
                    }
                }

                cellNode.fwData.listVisible = true;
                listNode.style.top = String(cellNode.fwData.nodeOffset.top + cellNode.offsetHeight) + 'px';
                listNode.style.left = String(cellNode.fwData.nodeOffset.left) + 'px';
                listUlNode.style.height = truncateY ? String(childHeight * cellNode.fwCell.maxLines) + 'px' : '';
                listNode.style.width = String(cellNode.offsetWidth) + 'px';
                listNode.style.zIndex = this.getzIndex() + 2;
                listHandler();
            } else {
                this.hideList(cellNode);
            }
        }
    }
    /**
     * Hide the select list for select or search input nodes
     * @method hideList
     * @private
     */
    hideList(cellNode) {
        var listNode, listUlNode;

        if (cellNode.fwCell.type === 'selectInput' || cellNode.fwCell.type === 'searchInput') {
            cellNode.fwData.listVisible = false;
            listUlNode = cellNode.fwCell.listUlNode;

            if (listUlNode !== null) {
                listNode = listUlNode.parentNode;
                listNode.parentNode.removeChild(listNode);
                cellNode.fwCell.listUlNode = null;
            }
        }
    }
    /**
     * Select a label for search input node
     * @method setSearchLabel
     * @private
     * @param {Node} cellNode
     * @param {string} label
     */
    setSearchLabel(cellNode, label) {
        var value = null;
        var labelOutput = '';
        var item = {};
        var labels, options, n;

        if (cellNode.fwCell.type === 'searchInput') {
            labels = cellNode.fwData.labels;
            options = cellNode.fwData.options;
            n = labels.indexOf(label);

            if (n !== -1) {
                labelOutput = label;
                item = options[n];
            }

            value = labelOutput.length > 0 ? labelOutput : null;
            cellNode.fwCell.inputNode.value = labelOutput;
            cellNode.fwData.currentLabel = labelOutput;
            cellNode.fwData.value = value;
            cellNode.fwData.item = item;
        }
    }
    /**
     * Set options to a search input node
     * @method setSearchOptions
     * @private
     * @param {Node} cellNode
     * @param {Object|Array} options
     */
    setSearchOptions(cellNode, options) {
        var n, l, labels, column;

        if (cellNode.fwCell.type === 'searchInput') {
            column = cellNode.fwCell.column;
            labels = column.nullable ? [''] : [];

            if (!(options instanceof Array)) {
                options = [options];
            }

            for (n = 0, l = options.length; n < l; n++) {
                labels.push(String(options[n][column.label]));
            }

            cellNode.fwData.labels = labels;
            cellNode.fwData.options = options;
        }
    }
    /**
     * Show the result of the search for a search input node
     * @method showSearchList
     * @private
     * @param {Node} cellNode
     * @param {string} filter
     */
    showSearchList(cellNode, filter) {
        var self = this;

        if (cellNode.fwCell.type === 'searchInput') {
            if (cellNode.fwCell.searchSource instanceof SearchSource) {
                (function (searchCellNode) {
                    searchCellNode.fwCell.searchSource.load({ filter: filter})
                    .then(function (items) {
                        var truncateY, label, labels, child, childHeight, n, l, listNode, listUlNode;

                        function listHandler() {
                            var currentOffset = fw.getOffset(cellNode);

                            if (cellNode.fwData.nodeOffset.top !== currentOffset.top) {
                                cellNode.fwData.nodeOffset.top = currentOffset.top;
                                listNode.style.top = String(cellNode.fwData.nodeOffset.top + searchCellNode.offsetHeight) + 'px';
                            }

                            if (cellNode.fwData.nodeOffset.left !== currentOffset.left) {
                                cellNode.fwData.nodeOffset.left = currentOffset.left;
                                listNode.style.left = String(cellNode.fwData.nodeOffset.left) + 'px';
                            }

                            if (cellNode.fwData.listVisible) {
                                window.setTimeout(listHandler, 1);
                            }
                        }

                        self.setSearchOptions(searchCellNode, items);
                        labels = searchCellNode.fwData.labels;
                        l = labels.length;

                        if (l > 0) {
                            listUlNode = searchCellNode.fwCell.listUlNode;

                            if (listUlNode === null) {
                                listNode = document.createElement('div');
                                listNode.style.top = 0;
                                listNode.style.left = 0;
                                listNode.style.height = 0;
                                listNode.style.width = 0;
                                listNode.classList.add('fw-editabledategrid-list');
                                listUlNode = document.createElement('ul');
                                listNode.appendChild(listUlNode);
                                listNode.addEventListener('mouseover', function(listenerEvent) { self.onListMouseOver.call(self, listenerEvent); }, false);
                                listNode.addEventListener('mousedown', function(listenerEvent) { self.onListMouseDown.call(self, listenerEvent); }, false);
                                document.body.appendChild(listNode);
                                cellNode.fwCell.listUlNode = listUlNode;
                                listUlNode.fwCellNode = listUlNode;
                            } else {
                                listNode = listUlNode.parentNode;
                                listNode.style.top = 0;
                                listNode.style.left = 0;
                                listNode.style.height = 0;
                                listNode.style.width = 0;
                                fw.emptyNode(listUlNode);
                            }

                            truncateY = l > searchCellNode.fwCell.maxLines;

                            for (n = 0; n < l; n++) {
                                label = labels[n];
                                child = document.createElement('li');

                                if (label === null || label.trim().length === 0) {
                                    child.classList.add('empty');
                                } else {
                                    child.appendChild(document.createTextNode(label));
                                }

                                listUlNode.appendChild(child);

                                if (n === 0) {
                                    if (truncateY) {
                                        listUlNode.style.overflowY = 'scroll';
                                        childHeight = child.offsetHeight;
                                    } else {
                                        listUlNode.style.overflowY = '';
                                    }
                                }
                            }

                            if (searchCellNode.fwCell.column.nullable) {
                                if (listUlNode.childNodes.length > 1) {
                                    listUlNode.childNodes[1].classList.add('selected');
                                } else {
                                    listUlNode.firstElementChild.classList.add('selected');
                                }
                            } else {
                                if (listUlNode.childNodes.length > 0) {
                                    listUlNode.firstElementChild.classList.add('selected');
                                }
                            }

                            cellNode.fwData.listVisible = true;
                            listNode.style.top = String(cellNode.fwData.nodeOffset.top + searchCellNode.offsetHeight) + 'px';
                            listNode.style.left = String(cellNode.fwData.nodeOffset.left) + 'px';
                            listUlNode.style.height = truncateY ? String(childHeight * cellNode.fwCell.maxLines) + 'px' : '';
                            listNode.style.width = String(searchCellNode.offsetWidth) + 'px';
                            listNode.style.zIndex = self.getzIndex() + 2;
                            listHandler();
                        } else {
                            self.hideList(searchCellNode);
                        }
                    });
                })(cellNode);
            }
        }
    }
    /**
     * blur the cell node
     * @method setBlurOnCellNode
     * @private
     * @param {Node} cellNode
     */
    setBlurOnCellNode(cellNode) {
        var type = cellNode.fwCell.type;

        if (type === 'timestampInput') {
            cellNode.classList.remove('dateInputFocused');
            cellNode.classList.remove('timeInputFocused');

            if (!cellNode.fwData.insideFocus) {
                this.updateCellNode(cellNode);
                cellNode.fwData.focused = false;
            }
        } else {
            cellNode.classList.remove('focused');
            this.updateCellNode(cellNode);
            cellNode.fwData.focused = false;
        }

        if (cellNode.fwCell.validationEnabled) {
            if (!this.validateCell(cellNode.fwCell.index, cellNode.fwCell.numCol)) {
                cellNode.classList.add('invalid');
            } else {
                cellNode.classList.remove('invalid');
            }
        }
    }
    /**
     * Trigger the onAttach event
     * @method onAttach
     * @private
     */
    onAttach() {
        this.repaint();
    }
    /**
     * Description
     * @method bindUI
     * @private
     */
    bindUI() {
        this.on('focus', this.onFocus);
        this.on('blur', this.onBlur);
        this.on('click', this.onClick);
        this.on('mousedown', this.onMouseDown);
        this.on('keydown', this.onKeyDown);
        this.on('keyup', this.onKeyUp);
        this.on('keypress', this.onKeyPress);
        this.on(['mouseup', 'mouseout'], this.deactivate);

        this.onWindowEvent('resize', this.onWindowResize);
        this.onWindowEvent('mousemove', this.onWindowMouseMove);
        this.onWindowEvent('mouseup', this.onWindowMouseUp);
    }
    /**
     * focus event handler
     * @method onFocus
     * @private
     */
    onFocus(e) {
        this.setFocusOnCellByChild(e.target);
    }
    /**
     * blur event handler
     * @method onBlur
     * @private
     */
    onBlur(e) {
        var cellNode = this.getCellNodeByChild(e.target);

        if (cellNode !== null) {
            this.setBlurOnCellNode(cellNode);
        }
    }
    /**
     * click event handler
     * @method onClick
     * @private
     */
    onClick(e) {
        var cellNode = this.getCellNodeByChild(e.target);
        var numAction, numCol, numRow, index;

        if (this.enabled &&
            this.footerNode.contains(e.target.parentNode) &&
            e.target.parentNode.classList.contains('fw-editabledatagrid-faction')) {

            if (e.target.parentNode.classList.contains('go-first')) {
                if (this.page > 1) { this.goFirstPage(); }
            } else if (e.target.parentNode.classList.contains('go-last')) {
                if (this.page < this.maxPages) { this.goLastPage(); }
            } else if (e.target.parentNode.classList.contains('go-previous')) {
                if (this.page > 1) { this.goPreviousPage(); }
            } else if (e.target.parentNode.classList.contains('go-next')) {
                if (this.page < this.maxPages) { this.goNextPage(); }
            }

        } else if (this.bodyNode.contains(e.target) &&
            e.target.classList.contains('fw-editabledatagrid-baction')) {

            numAction = e.target.parentNode.cellIndex;
            numCol = e.target.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.cellIndex;
            numRow = e.target.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.rowIndex - 1;
            index = ((this.page - 1) * this.size) + numRow;

            if (!e.target.classList.contains('disabled') &&
                fw.isFunction(this.columns[numCol].actions[numAction].onClick)) {
                this.columns[numCol].actions[numAction].onClick(this.list[numRow]);
            }

        } else if (cellNode !== null &&
            cellNode.fwCell.type === 'checkboxInput' &&
            !cellNode.fwCell.disabled) {

            cellNode = this.setFocusOnCellByChild(e.target);
            cellNode.fwCell.frameNode.focus();

            if (!cellNode.classList.contains('checked')) {
                cellNode.classList.add('checked');
            } else {
                cellNode.classList.remove('checked');
            }

            this.updateCellNode(cellNode);
        }
    }
    /**
     * mousedown event handler
     * @method onMouseDown
     * @private
     */
    onMouseDown(e) {
        var self = this;
        var cellNode = this.getCellNodeByChild(e.target);
        var nodes, n, l;

        if (e.target.classList.contains('fw-editabledataigrid-resizer')) {
            this.mousedown = true;
            this.mouseStartX = e.clientX;
            this.numColResized = e.target.parentNode.parentNode.cellIndex - 1;
            nodes = this.node.getElementsByClassName('fw-editabledatagrid-list');

            for (n = 0, l = nodes.length; n < l; n++) {
                this.hideList(nodes[n].fwData.cell);
            }
        } else if (this.footerNode.contains(e.target) && e.target.classList.contains('fw-datagrid-faction')) {
            if (!e.target.classList.contains('disabled')) {
                e.target.classList.add('activated');
            }
        } else if (cellNode !== null) {
            if (cellNode.fwCell.disabled) {
                e.preventDefault();
                return;
            }

            switch (cellNode.fwCell.type) {
                case 'checkboxInput':
                    cellNode.classList.add('activated');
                    break;
                case 'selectInput':
                    if (cellNode.fwCell.buttonNode.contains(e.target)) {
                        cellNode.fwCell.inputNode.focus();
                        cellNode.fwCell.buttonNode.classList.add('activated');
                        this.showSelectList(cellNode);
                        e.preventDefault();
                    }

                    break;
                case 'searchInput':
                    if (cellNode.fwCell.buttonNode.contains(e.target)) {
                        cellNode.fwCell.inputNode.focus();
                        cellNode.fwCell.buttonNode.classList.add('activated');
                        e.preventDefault();

                        if (fw.isFunction(cellNode.fwCell.addWindowModal)) {
                            if (this.addWindowModalInstances[cellNode.fwCell.numCol] === undefined) {
                                this.addWindowModalInstances[cellNode.fwCell.numCol] = new cellNode.fwCell.addWindowModal();
                            }

                            this.addWindowModalInstances[cellNode.fwCell.numCol].onBeforeHide = function() {
                                cellNode.fwData.focused = true;
                                cellNode.fwCell.validationEnabled = true;
                            };

                            this.addWindowModalInstances[cellNode.fwCell.numCol].onAdd = function(item) {
                                self.setSearchOptions(cellNode, item.getObject());
                                cellNode.fwCell.inputNode.value = item.get(cellNode.fwCell.column.label);
                                self.updateCellNode(cellNode);
                            };

                            cellNode.fwCell.validationEnabled = false;
                            this.addWindowModalInstances[cellNode.fwCell.numCol].show();
                        }
                    }
                    break;
                case 'timestampInput':
                    cellNode.fwData.insideFocus =
                        (cellNode.classList.contains('dateInputFocused') && cellNode.fwCell.inputNodes[1].parentNode.contains(e.target)) ||
                        (cellNode.classList.contains('timeInputFocused') && cellNode.fwCell.inputNodes[0].parentNode.contains(e.target));
                    break;
            }
        }
    }
    /**
     * keydown event handler
     * @method onKeyDown
     * @private
     */
    onKeyDown(e) {
        var cellNode = this.getCellNodeByChild(e.target);
        var type, listUlNode, value, selected;
        var selectedPrevious, selectedNext;

        if (cellNode !== null) {
            switch (cellNode.fwCell.type) {
                case 'checkboxInput':
                    if (KeyboardManager.isActive('ENTER') || KeyboardManager.isActive('SPACE')) {
                        value = !cellNode.classList.contains('checked');

                        if (value) {
                            cellNode.classList.add('checked');
                        } else {
                            cellNode.classList.remove('checked');
                        }

                        cellNode.classList.add('activated');
                        this.updateCellNode(cellNode);
                    }
                    break;
                case 'textInput':
                case 'numberInput':
                case 'integerInput':
                case 'currencyInput':
                    if (KeyboardManager.isActive('ENTER')) {
                        e.preventDefault();
                    }
                    break;
                case 'timestampInput':
                    if (KeyboardManager.isActive('ENTER')) {
                        e.preventDefault();
                    } else if (KeyboardManager.isActive('TAB')) {
                        cellNode.fwData.insideFocus = cellNode.classList.contains('dateInputFocused');
                    }

                    break;
                case 'selectInput':
                case 'searchInput':
                    if (KeyboardManager.isActive('SPACE')) {
                        e.preventDefault();
                    } else if (KeyboardManager.isActive('ARROW_UP')) {
                        listUlNode = cellNode.fwCell.listUlNode;

                        if (listUlNode === null) {
                            if (type === 'selectInput') {
                                this.showSelectList(cellNode, cellNode.fwCell.inputNode.value);
                                listUlNode = cellNode.fwCell.listUlNode;

                                if (listUlNode === null) {
                                    e.preventDefault();
                                    return;
                                }
                            } else {
                                e.prevenDefault();
                                return;
                            }
                        }

                        selected = listUlNode.getElementsByClassName('selected')[0];

                        if (selected !== undefined) {
                            selected.classList.remove('selected');
                            selectedPrevious = (selected.previousElementSibling === null) ? listUlNode.lastElementChild : selected.previousElementSibling;
                            selectedPrevious.classList.add('selected');
                        } else if (listUlNode.lastElementChild !== null) {
                            listUlNode.lastElementChild.classList.add('selected');
                        }

                        e.preventDefault();
                    } else if (KeyboardManager.isActive('ARROW_DOWN')) {
                        listUlNode = cellNode.fwCell.listUlNode;

                        if (listUlNode === null) {
                            if (type === 'selectInput') {
                                this.showSelectList(cellNode, cellNode.fwCell.inputNode.value);
                                listUlNode = cellNode.fwCell.listUlNode;

                                if (listUlNode === null) {
                                    e.preventDefault();
                                    return;
                                }
                            } else {
                                e.prevenDefault();
                                return;
                            }
                        }

                        selected = listUlNode.getElementsByClassName('selected')[0];

                        if (selected !== undefined) {
                            selected.classList.remove('selected');
                            selectedNext = selected.nextElementSibling;
                            selectedNext = (selected.nextElementSibling === null) ? listUlNode.firstElementChild : selected.nextElementSibling;
                            selectedNext.classList.add('selected');
                        } else if (listUlNode.firstElementChild !== null) {
                            listUlNode.firstElementChild.classList.add('selected');
                        }

                        e.preventDefault();
                    } else if (
                        KeyboardManager.isActive('ARROW_LEFT') &&
                        KeyboardManager.isActive('ARROW_RIGHT')) {

                        listUlNode = cellNode.fwCell.listUlNode;

                        if (listUlNode !== null) {
                            e.preventDefault();
                        }
                    }

                    break;
            }
        }
    }
    /**
     * keyup event handler
     * @method onKeyUp
     * @private
     */
    onKeyUp(e) {
        var cellNode = this.getCellNodeByChild(e.target);
        var listUlNode;

        if (cellNode !== null) {
            if (KeyboardManager.isActive(['CTRL', 'z'])) {
                this.restoreCellNode(cellNode);
                e.preventDefault();
                return;
            }

            switch (cellNode.fwCell.type) {
                case 'checkboxInput':
                    cellNode.classList.remove('activated');
                    break;
                case 'selectInput':
                    if (KeyboardManager.isActive('ENTER')) {
                        this.updateCellNode(cellNode);
                    } else if (
                        !KeyboardManager.isActive('ARROW_UP') &&
                        !KeyboardManager.isActive('ARROW_DOWN') &&
                        !KeyboardManager.isActive('TAB')) {

                        this.showSelectList(cellNode, cellNode.fwCell.inputNode.value);

                        listUlNode = cellNode.fwCell.listUlNode;

                        if (listUlNode === null) {
                            e.preventDefault();
                            return;
                        }

                        if (cellNode.fwCell.column.nullable) {
                            if (listUlNode.childNodes.length > 1) {
                                listUlNode.childNodes[1].classList.add('selected');
                            } else {
                                listUlNode.firstElementChild.classList.add('selected');
                            }
                        } else if (listUlNode.firstElementChild !== null) {
                            listUlNode.firstElementChild.classList.add('selected');
                        }

                    }

                    break;
                case 'searchInput':
                    if (KeyboardManager.isActive('ENTER')) {
                        this.updateCellNode(cellNode);
                    } else if (
                        !KeyboardManager.isActive('ARROW_UP') &&
                        !KeyboardManager.isActive('ARROW_DOWN') &&
                        !KeyboardManager.isActive('TAB')) {

                        this.showSearchList(cellNode, cellNode.fwCell.inputNode.value);
                    }
                    break;
            }
        }
    }
    /**
     * keypress event handler
     * @method keypress
     * @private
     */
    onKeyPress(e) {
        if (e.charCode === 0) return;

        var cellNode = this.getCellNodeByChild(e.target);
        var numberValidator, positive;

        function getValue(node) {
            var value = '';
            var start = node.selectionStart;
            var end = node.selectionEnd;
            var n, l;

            for (n = 0, l = node.value.length + 1; n < l; n++) {
                if (n === start) {
                    value += String.fromCharCode(e.which);

                    if (n === end && n < node.value.length) {
                        value += node.value[n];
                    }
                } else if ((n < start || n >= end) && n < node.value.length) {
                    value += node.value[n];
                }
            }

            return value;
        }

        if (cellNode !== null) {
            if (cellNode.fwCell.disabled) {
                e.preventDefault();
                return;
            }

            switch (cellNode.fwCell.type) {
                case 'numberInput':
                    numberValidator = this.arraySource.getModel().getOption(cellNode.fwCell.property, 'numberValidator');
                    positive = numberValidator === undefined ? false : numberValidator.positive;

                    if (!FwNumber.checkInput(getValue(cellNode.fwCell.inputNode), { positive: positive })) {
                        e.preventDefault();
                    }

                    break;
                case 'integerInput':
                    numberValidator = this.arraySource.getModel().getOption(cellNode.fwCell.property, 'numberValidator');
                    positive = numberValidator === undefined ? false : numberValidator.positive;

                    if (!FwInteger.checkInput(getValue(cellNode.fwCell.inputNode), { positive: positive })) {
                        e.preventDefault();
                    }

                    break;
                case 'currencyInput':
                    numberValidator = this.arraySource.getModel().getOption(cellNode.fwCell.property, 'numberValidator');
                    positive = numberValidator === undefined ? false : numberValidator.positive;

                    if (!FwCurrency.checkInput(getValue(cellNode.fwCell.inputNode), { positive: positive } )) {
                        e.preventDefault();
                    }

                    break;
                case 'timestampInput':
                    if (e.target.classList.contains('fw-editabledatagrid-timestampfield')) {
                        if (!FwTimestamp.checkDateDDMMYYYYInput(getValue(cellNode.fwCell.inputNodes[0]))) {
                            e.preventDefault();
                        }
                    } else {
                        if (!FwTimestamp.checkTimeInput(getValue(cellNode.fwCell.inputNodes[1]))) {
                            e.preventDefault();
                        }
                    }

                    break;
            }
        }
    }
    /**
     * mouseup and mouseout events handler
     * @method deactivate
     * @private
     */
    deactivate(e) {
        var cellNode = this.getCellNodeByChild(e.target);

        if (cellNode !== null) {
            if (cellNode.fwCell.disabled) {
                e.preventDefault();
                return;
            }

            switch (cellNode.fwCell.type) {
                case 'selectInput':
                case 'searchInput':
                    cellNode.fwCell.buttonNode.classList.remove('activated');
                    break;
                case 'checkboxInput':
                    cellNode.classList.remove('activated');
                    break;
            }
        }
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
            nodes = e.target.parentNode.getElementsByClassName('selected');

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
        var cellNode;

        if (e.target.nodeName === 'LI') {
            cellNode = e.target.parentNode.fwCellNode;
            this.updateCellNode(cellNode);
            cellNode.focus();
            e.preventDefault();
        }
    }
    /**
     * focus event handler
     * @method onFoc
    /**
     * resize window event handler
     * @method onWindowResize
     * @private
     */
    onWindowResize() {
        this.repaint();
    }
    /**
     * mousemove window event handler
     * @method onWindowMouseMove
     * @private
     */
    onWindowMouseMove(e) {
        if (this.mousedown) {
            this.resizeColumn(this.numColResized, e.clientX - this.mouseStartX);
        }
    }
    /**
     * mouseup window event handler
     * @method onWindowMouseUp
     * @private
     */
    onWindowMouseUp() {
        this.mousedown = false;
        this.mouseStartX = null;
        this.numColResized = null;
        this.columnWidth = null;
    }
    /**
     * Build the EditableDataGrid header
     * @method buildHeader
     * @private
     */
    buildHeader() {
        var rowHTML = [];
        var resizerZIndex = this.getzIndex() + 1;
        var column, cell, classActive, header, n, l;

        for (n = 0, l = this.columns.length; n < l; n++) {
            column = this.columns[n];
            classActive = false;
            header = this.createMessage(column.header);
            cell = '<th style="width:' + column.width + 'px"><div class="header">';

            if (n > 0) {
                cell += '<div class="fw-editabledatagrid-resizer" style="z-index:"' + resizerZIndex + '></div>';
            }

            cell += '<div class="fw-editabledatagrid-hlabel">' + header + '</div></div></th>';
            rowHTML.push(cell);
        }

        this.headerNode.innerHTML = '<tr>' + rowHTML.join('') + '<th class="last"><div class="fw-editabledatagrid-hlabel"><div class="fw-editabledatagrid-resizer"></div><div>&nbsp;</div></div></th><th class="expandable"><div></div></th></tr>';
    }
    /**
     * Go the specified page
     * @method goPage
     * @param {number} page
     */
    goPage(page) {
        if (!(this.arraySource instanceof ArraySource) || !this.builtUI) return;

        var startIndex;

        if (this.maxPages > 0) {
            this.page = page;

            if (this.page < 1) {
                this.page = 1;
            }

            if ((this.size * (this.page - 1)) >= this.arraySource.getSize()) {
                this.page = this.maxPages;
            }

            startIndex = (this.page - 1) * this.size;
            this.list = this.arraySource.source.getSlice(startIndex, startIndex + this.size);
        } else {
            this.page = 0;
            this.list = [];
        }

        this.load();
    }
    /**
     * Go to the current page (equivalent to a refresh)
     * @method goCurrentPage
     */
    goCurrentPage() {
        this.goPage(this.page);
    }
    /**
     * Go to the first page
     * @method goFirstPage
     */
    goFirstPage() {
        this.goPage(1);
    }
    /**
     * Go to the previous page
     * @method goPreviousPage
     */
    goPreviousPage() {
        this.goPage(this.page - 1);
    }
    /**
     * Go to the last page
     * @method goLastPage
     */
    goLastPage() {
        this.goPage(this.maxPages);
    }
    /**
     * Go to the next page
     * @method goNextPage
     */
    goNextPage() {
        this.goPage(this.page + 1);
    }
    /**
     * Get cell value
     * @method getCellValue
     * @param {number} numRow
     * @param {number} numCol
     * @return {*} value
     */
    getCellValue(numRow, numCol) {
        if (!(this.arraySource instanceof ArraySource)) return;

        var item = this.list[numRow];
        var column = this.columns[numCol];
        var value, n;

        value = item.get(column.property);

        switch (column.type) {
            case 'textInput':
            case 'searchInput':
                value = fw.isNotNull(value) ? value : '';
                break;
            case 'selectInput':
                n = column.selectKeys.indexOf(value);
                value = n !== -1 ? column.selectLabels[n] : '';
                break;
        }

        return value;
    }
    /**
     * Get cell (for building the editable data grid body)
     * @method getCell
     * @private
     * @param {number} numRow
     * @param {number} numCol
     * @return {string} cell
     */
    getCell(numRow, numCol) {
        if (!(this.arraySource instanceof ArraySource)) return '<div class="fw-editabledatagrid-empty">&nbsp;</div>';

        var item = this.list[numRow];
        var index = ((this.page - 1) * this.size) + numRow;
        var column = this.columns[numCol];
        var disabled = fw.isBoolean(column.disabled) ? column.disabled : false;
        var value, cell, n, l, actionLabel, actionEnabled, errorMessage;

        if (this.invalidCells[index]) {
            errorMessage = this.invalidCells[index][numCol];
        }

        if (column.actions instanceof Array) {
            cell = '<div class="fw-editabledatagrid-bactions"><table cellspacing="0" cellpadding="0"><tbody><tr>';

            for (n = 0, l = column.actions.length; n < l; n++) {
                actionLabel = this.createMessage(column.actions[n].value);
                actionEnabled = fw.isFunction(column.actions[n].condition) ? column.actions[n].condition(item) : true;
                cell += '<td><div class="fw-editabledatagrid-baction' + (!actionEnabled ? ' disabled' : '') + '">' + actionLabel + '</div></td>';
            }

            cell += '</tr></tbody></table></div>';
        } else {
            value = this.getCellValue(numRow, numCol);

            switch (column.type) {
                case 'textInput':
                    cell = '<div class="fw-editabledatagrid-textfield' + (disabled ? ' disabled' : '') + (errorMessage !== undefined ? ' invalid' : '') + '"><input' + (disabled ? ' disabled="true"' : '') + ' type="text" value="' + value + '" spellcheck="false"></input></div>';
                    break;
                case 'numberInput':
                    cell = '<div class="fw-editabledatagrid-numberfield' + (disabled ? ' disabled' : '') + (errorMessage !== undefined ? ' invalid' : '') + '"><input' + (disabled ? ' disabled="true"' : '') + ' type="text" value="' + value.toString() + '" spellcheck="false"></input></div>';
                    break;
                case 'integerInput':
                    cell = '<div class="fw-editabledatagrid-integerfield' + (disabled ? ' disabled' : '') + (errorMessage !== undefined ? ' invalid' : '') + '"><input' + (disabled ? ' disabled="true"' : '') + ' type="text" value="' + value.toString() + '" spellcheck="false"></input></div>';
                    break;
                case 'currencyInput':
                    cell = '<div class="fw-editabledatagrid-currencyfield' + (disabled ? ' disabled' : '') + (errorMessage !== undefined ? ' invalid' : '') + '"><input' + (disabled ? ' disabled="true"' : '') + ' type="text" value="' + value.toString() + '" spellcheck="false"></input></div>';
                    break;
                case 'timestampInput':
                    cell = '<div class="fw-editabledatagrid-timestampfield' + (disabled ? ' disabled' : '') + (errorMessage !== undefined ? ' invalid' : '') + '"><div class="fw-editabledatagrid-timestampfield-date"><input' + (disabled ? ' disabled="true"' : '') + ' type="text" value="' + value.toDMYString() + '"></input></div><div class="fw-editabledatagrid-timestampfield-time"><input' + (disabled ? ' disabled="true"' : '') + ' type="text" value="' + value.toHMSString() + '" spellcheck="false"></input></div></div>';
                    break;
                case 'checkboxInput':
                    cell = '<div class="fw-editabledatagrid-checkbox' + (disabled ? ' disabled' : '') + (errorMessage !== undefined ? ' invalid' : '') + (value ? ' checked' : '') + '"><div' + (disabled ? '' : ' tabindex="0"') + ' class="fw-editabledatagrid-checkbox-frame"></div></div>';
                    break;
                case 'selectInput':
                    cell = '<div class="fw-editabledatagrid-selectfield' + (disabled ? ' disabled' : '') + (errorMessage !== undefined ? ' invalid' : '') + '"><div class="fw-editabledatagrid-selectfield-input"><input' + ((disabled) ? ' disabled="true"' : '') + ' type="text" value="' + value + '" spellcheck="false"></input></div><div class="fw-editabledatagrid-selectfield-button"><div><div></div></div></div></div>';
                    break;
                case 'searchInput':
                    cell = column.addWindowModal ?
                        '<div class="fw-editabledatagrid-searchfield-full' + (disabled ? ' disabled' : '') + (errorMessage !== undefined ? ' invalid' : '') + '"><div class="fw-editabledatagrid-searchfield-full-input"><input' + (disabled ? ' disabled="true"' : '') + ' type="text" value="' + value + '" spellcheck="false"></input></div><div class="fw-editabledatagrid-searchfield-full-button"><div><div></div></div></div></div>' :
                        '<div class="fw-editabledatagrid-searchfield' + (disabled ? ' disabled' : '') + (errorMessage !== undefined ? ' invalid' : '') + '"><input' + (disabled ? ' disabled="true"' : '') + ' type="text" value="' + value + '" spellcheck="false"></input></div>';
                    break;
                case 'timestampLabel':
                    cell = '<div class="fw-editabledatagrid-blabel">' + value.toDMYHMSString() + '</div>';
                    break;
                case 'numberLabel':
                case 'integerLabel':
                    cell = '<div class="fw-editabledatagrid-blabel">' + value.toString({ decimals: column.decimals }) + '</div>';
                    break;
                case 'currencyLabel':
                    cell = '<div class="fw-editabledatagrid-blabel">' + value.toString() + '</div>';
                    break;
                default:
                    if (fw.isValidNumber(value)) {
                        value = String(value);
                    } else if (fw.isFunction(value.toString)) {
                        if ((value = value.toString()).length === 0) {
                            value = '&nbsp;';
                        }
                    } else {
                        value = '&nbsp;';
                    }
                    cell = '<div class="fw-editabledatagrid-blabel">' + value + '</div>';
            }
        }

        return cell;
    }
    /**
     * Get row (for building the editable data grid body)
     * @method getRow
     * @private
     * @param {Object} item
     * @return {string} row
     */
    getRow(numRow) {
        var rowHTML = ['<tr class="fw-editabledatagrid-row">'];
        var n, l;

        for (n = 0, l = this.columns.length; n < l; n++) {
            rowHTML.push('<td class="fw-editabledatagrid-cell">');
            rowHTML.push(this.getCell(numRow, n));
            rowHTML.push('</td>');
        }

        rowHTML.push('<td></td><td></td></tr>');

        return rowHTML.join('');
    }
    /**
     * Refresh cell
     * @method refreshCell
     * @private
     * @param {number} numRow
     * @param {number} numCol
     */
    refreshCell(numRow, numCol) {
        if (!(this.arraySource instanceof ArraySource)) return;

        var item = this.list[numRow];
        var index = ((this.page - 1) * this.size) + numRow;
        var column = this.columns[numCol];
        var inputFound = false;
        var cellNode, node, inputNode, inputNodes, content, value, disabled, n, l, actionLabel, actionEnabled, errorMessage;

        disabled = fw.isBoolean(column.disabled) ? column.disabled : false;

        if (this.invalidCells[index]) {
            errorMessage = this.invalidCells[index][numCol];
        }

        cellNode = this.bodyNode.childNodes[numRow].childNodes[numCol];

        if (column.actions instanceof Array) {
            node = cellNode.getElementsByTagName('tr')[0];
            content = '';

            for (n = 0, l = column.actions.length; n < l; n++) {
                actionLabel = this.createMessage(column.actions[n].value);
                actionEnabled = fw.isFunction(column.actions[n].condition) ? column.actions[n].condition(item) : true;
                content += '<td><div class="fw-editabledatagrid-baction' + (!actionEnabled ? ' disabled' : '') + '">' + actionLabel + '</div></td>';
            }

            node.innerHTML = content;
        } else {
            value = this.getCellValue(numRow, numCol);
            node = cellNode.firstElementChild;

            switch (column.type) {
                case 'textInput':
                case 'numberInput':
                case 'integerInput':
                case 'currencyInput':
                    inputNode = node.firstElementChild;
                    inputNode.value = value.toString();
                    inputNode.disabled = disabled;
                    inputFound = true;
                    break;
                case 'timestampInput':
                    inputNodes = node.getElementsByTagName('input');
                    inputNodes[0].value = value.toDMYString();
                    inputNodes[0].disabled = disabled;
                    inputNodes[1].value = value.toHMSString();
                    inputNodes[1].disabled = disabled;
                    inputFound = true;
                    break;
                case 'checkboxInput':
                    inputNode = node.firstElementChild;

                    if (value) {
                        node.classList.add('checked');
                    } else {
                        node.classList.remove('checked');
                    }

                    inputNode.tabIndex = disabled ? '' : '0';
                    inputFound = true;
                    break;
                case 'selectInput':
                case 'searchInput':
                    inputNode = node.firstElementChild.firstElementChild;
                    inputNode.value = value.toString();
                    inputNode.disabled = disabled;
                    inputFound = true;
                    break;
                case 'timestampLabel':
                    node.innerHTML = value.toHMSMSString();
                    break;
                case 'currencyLabel':
                case 'numberLabel':
                case 'integerLabel':
                    node.innerHTML = value.toString();
                    break;
                default:
                    if (fw.isValidNumber(value)) {
                        value = String(value);
                    } else if (!fw.isString(value)) {
                        value = '&nbsp;';
                    }

                    node.innerHTML = value;
            }

            if (inputFound) {
                if (disabled) {
                    node.classList.add('disabled');
                } else {
                    node.classList.remove('disabled');
                }

                if (errorMessage !== undefined) {
                    node.classList.add('invalid');
                } else {
                    node.classList.remove('invalid');
                }
            }
        }
    }
    /**
     * Refresh row
     * @method refreshRow
     * @private
     * @param {number} numRow
     */
    refreshRow(numRow) {
        if (numRow < 0 || numRow >= this.list.length) return;

        var index = numRow + ((this.page - 1) * this.size);
        var n, l;

        this.list[numRow] = this.arraySource.get(index);

        for (n = 0, l = this.columns.length; n < l; n++) {
            this.refreshCell(numRow, n);
        }
    }
    /**
     * Build the EditableDataGrid body
     * @method buildBody
     * @private
     */
    buildBody() {
        var rowsHTML = [];
        var i = 0;
        var rowHTML;
        var j, n, l;

        if (this.arraySource instanceof ArraySource) {
            for (i = 0, j = this.list.length; i < j; i++) {
                rowsHTML.push(this.getRow(i));
            }
        }

        for (; i < this.size; i++) {
            rowHTML = ['<tr class="row">'];

            for (n = 0, l = this.columns.length; n < l; n++) {
                rowHTML.push('<td class="fw-editabledatagrid-cell"><div class="fw-editabledatagrid-empty">&nbsp;</div></td>');
            }

            rowHTML.push('<td></td><td></td></tr>');
            rowsHTML.push(rowHTML.join(''));
        }

        this.bodyNode.innerHTML = rowsHTML.join('');
    }
    /**
     * Build the EditableDataGrid footer
     * @method buildFooter
     * @private
     */
    buildFooter() {
        this.footerNode.innerHTML = '<table>\
                <tbody>\
                    <tr>\
                        <td class="fw-editabledatagrid-faction go-first' + ((this.page > 1) ? '"' : ' disabled"') + '><div></div></td>\
                        <td class="fw-editabledatagrid-faction go-previous' + ((this.page > 1) ? '"' : ' disabled"') + '><div></div></td>\
                        <td class="fw-editabledatagrid-faction go-next' + ((this.page < this.maxPages) ? '"' : ' disabled"') + '><div></div></td>\
                        <td class="fw-editabledatagrid-faction go-last' + ((this.page < this.maxPages) ? '"' : ' disabled"') + '><div></div></td>\
                        <td class="fw-editabledatagrid-finfo"><div>' + ((this.arraySource && (this.arraySource.getSize() > 0)) ? (this.createMessage('results') + this.page + ' - ' + this.maxPages + this.createMessage('on') + this.arraySource.getSize()) : this.createMessage('noResult')) + '</div></td>\
                    </tr>\
                </tbody>\
            </table>';
    }
    /**
     * Load the EditableDataGrid
     * @method load
     */
    load() {
        this.enabled = true;
        this.refresh();
    }
    /**
     * Refresh the EditableDataGeid
     * @method refresh
     */
    refresh() {
        if (!this.builtUI) return;

        this.buildHeader();
        this.buildBody();
        this.buildFooter();
    }
    /**
     * Synchronize the grid with its ArraySource
     * @method synchronize
     * @param {string} action - "init", "add", "update" or "delete" actions
     * @param {number} [index] - row item to be synchronized
     */
    synchronize(action, index) {
        if (!this.arraySource) return;

        var page, numRow;

        switch (action) {
            case 'add':
                this.maxPages = Math.ceil(this.arraySource.getSize() / this.size);
                this.goLastPage();
                break;
            case 'delete':
                if (this.invalidCells[index] !== undefined) {
                    delete this.invalidCells[index];
                }

                for (numRow in this.invalidCells) {
                    if (numRow > index && this.invalidCells[numRow] !== undefined) {
                        this.invalidCells[numRow - 1] = this.invalidCells[numRow];
                        delete this.invalidCells[numRow];
                    }
                }

                this.maxPages = Math.ceil(this.arraySource.getSize() / this.size);
                this.goCurrentPage();
                break;
            case 'init':
                this.maxPages = Math.ceil(this.arraySource.getSize() / this.size);
                this.invalidCells = {};
                this.goFirstPage();
                break;
            case 'update':
                page = Math.floor(index / this.size) + 1;
                if (this.page === page) {
                    this.refreshRow(index - ((page - 1) * this.size));
                } else {
                    this.goPage(page);
                }
                break;
        }
    }
    /**
     * Validate cell
     * @method validateCell
     * @param {number} index
     * @param {number} numCol
     * @return {boolean} isValid
     */
    validateCell(index, numCol) {
        var item = this.arraySource.get(index);
        var column = this.columns[numCol];
        var errors = item.getErrorMessages(column.property);
        var error;

        if (errors.length > 0) {
            error = errors[0];
        }

        if (error !== undefined) {
            if (this.invalidCells[index] === undefined) {
                this.invalidCells[index] = {};
            }

            this.invalidCells[index][numCol] = this.createMessage(error);

            return false;
        }

        if (fw.isFunction(column.check)) {
            error = column.check(item);

            if (error !== undefined) {
                if (this.invalidCells[index] === undefined) {
                    this.invalidCells[index] = {};
                }

                this.invalidCells[index][numCol] = this.createMessage(error);

                return false;
            }
        }

        if (this.invalidCells[index] !== undefined) {
            if (this.invalidCells[index][numCol] !== undefined) {
                delete this.invalidCells[index][numCol];
            }
        }

        return true;
    }
    /**
     * Validate the EditableDataGrid
     * @method validate
     * @return {boolean} isValid
     */
    validate() {
        var self = this;
        var firstPage, column, i, j, n, l;

        this.invalidCells = {};

        for (n = 0, l = this.columns.length; n < l; n++) {
            column = this.columns[n];

            if (fw.isString(column.property)) {
                for (i = 0, j = this.arraySource.getSize(); i < j; i++) {
                    if (!self.validateCell(i, n)) {
                        if (firstPage === undefined) {
                            firstPage = (Math.floor(i / self.size)) + 1;
                        }
                    }
                }
            }
        }

        if (firstPage !== undefined) {
            this.goPage(firstPage);
            this.emitEvent('invalid', this.node);

            return false;
        }

        return true;
    }
}

module.exports = EditableDataGrid;
