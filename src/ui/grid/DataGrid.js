/**
 * @module fw/ui/grid/DataGrid
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var ArrayElement = require('../ArrayElement');
var fw = require('../../Core');
var FwCurrency = require('../../type/Currency');
var FwDate = require('../../type/Date');
var FwNumber = require('../../type/Number');
var FwTimestamp = require('../../type/Timestamp');
var i18nGrid = require('../../nls/grid');
var PaginatedArraySource = require('../../source/PaginatedArraySource');
var ValidatorFactory = require('../../validator/ValidatorFactory');

/**
 * @typedef Action
 * @param {string} value - set the value of the action
 * @param {function} [onClick] - define an onClick event function
 */
/**
 * @typedef Column
 * @param {string} [column.property] - define the column property
 * @param {string} [column.type] - define the column type ('currencyLabel', 'numberLabel', 'dateLabel', 'timestampLabel')
 * @param {number|string} [column.width=100] - define the column width
 * @param {Array.<Action>} [column.actions] - define list of actions
 */
/**
 * Create a DataGrid which uses the fw/source/PaginatedArraySource as model source
 * @class
 * @alias module:fw/ui/grid/DataGrid
 * @augments fw/ui/ArrayElement
 * @param {Object} [config] - the configuration object of the datagrid
 * @param {fw/source/PaginatedArraySource} [config.paginatedArraySource] - attach a paginatedArraySource to the datagrid
 * @param {number} [config.size=10] - define the number rows displayed in the datagrid
 * @param {number|string} [config.width=100%] - define the datagrid width
 * @param {Array.<Column>} [config.columns] - define columns configuration
 */
class DataGrid extends ArrayElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-datagrid'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-datagrid'; // jshint ignore:line
    /**
     * Define the i18n dictionaries
     * @property i18n
     */
    static i18n = i18nGrid;
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */
    initialize() {
        super.initialize();

        var column, type;
        var n, l;

        this.activateSpinner = false;
        this.resizable = false;
        this.enabled = false;
        this.minimumWidth = 0;
        this.frameHeight = 0;
        this.mousedown = false;
        this.mouseStartX = null;
        this.numColResized = null;
        this.columnWidth = null;

        this.columns = fw.copyArray(this.config.columns);
        this.width = this.config.width || '100%';
        this.size = this.config.size || 10;

        for (n = 0, l = this.columns.length; n < l; n++) {
            column = this.columns[n];
            switch (column.type) {
                case 'currencyLabel':
                    type = FwCurrency;
                    break;
                case 'numberLabel':
                    type = FwNumber;
                    break;
                case 'dateLabel':
                    type = FwDate;
                    break;
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
                column.width = parseInt(column.width, 10) || 100;
            }
        }

        this.setPaginatedArraySource(this.config.paginatedArraySource || this.paginatedArraySource);
    }
    /**
     * Create the DataGrid nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node.style.width = this.width;
        this.node.innerHTML = '\
            <div class="fw-datagrid-content">\
                <div class="fw-datagrid-frame">\
                    <table>\
                        <thead></thead>\
                        <tbody></tbody>\
                    </table>\
                </div>\
                <div class="fw-datagrid-scroll"></div>\
                <div class="fw-datagrid-spinner"><div><div></div></div></div>\
            </div>\
            <div class="fw-datagrid-footer"></div>';
        this.contentNode = this.node.getElementsByClassName('fw-datagrid-content')[0];
        this.frameNode = this.contentNode.getElementsByClassName('fw-datagrid-frame')[0];
        this.tableNode = this.contentNode.getElementsByTagName('table')[0];
        this.headerNode = this.contentNode.getElementsByTagName('thead')[0];
        this.bodyNode = this.contentNode.getElementsByTagName('tbody')[0];
        this.footerNode = this.node.getElementsByClassName('fw-datagrid-footer')[0];
        this.scrollSpacer = this.node.getElementsByClassName('fw-datagrid-scroll')[0];
        this.spinnerNode = this.contentNode.getElementsByClassName('fw-datagrid-spinner')[0];

        this.calculateColumnWidths();
        this.buildHeader();
        this.buildBody();
        this.buildFooter();
    }
    /**
     * Synchronize the grid with its ArraySource
     * @method synchronize
     * @param {string} action - "init", "beforeLoad", "load", "fail" actions
     */
    synchronize(action) {
        switch (action) {
            case 'init':
                this.refresh();
                break;
            case 'beforeLoad':
                this.showSpinner();
                break;
            case 'load':
                this.enabled = true;
                this.refresh();
                this.hideSpinner();
                break;
            case 'fail':
                this.hideSpinner();
                break;
        }
    }
    /**
     * Set the PaginatedArraySource
     * @method setPaginatedArraySource
     * @param {fw/source/PaginatedArraySource} paginatedArraySource - paginatedArraySource linked to the DataGrid
     */
    setPaginatedArraySource(paginatedArraySource) {
        if (this.paginatedArraySource !== paginatedArraySource) {
            if (this.paginatedArraySource instanceof PaginatedArraySource) {
                this.paginatedArraySource.unbind();
            }

            if (paginatedArraySource instanceof PaginatedArraySource) {
                paginatedArraySource.bind(this);
            } else {
                this.paginatedArraySource = null;
            }
        }
    }
    /**
     * Get the PaginatedArraySource
     * @method getPaginatedArraySource
     * @return {fw/source/PaginatedArraySource)
     */
    getPaginatedArraySource() {
        return this.paginatedArraySource;
    }
    /**
     * Compute each columns width
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
     * Resize the column at defined index
     * @method resizeColumn
     * @param {number} numCol - index of the column to be resized
     * @param {number} delta - delta that will be applied to column
     * @private
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
     * Repaint the DataGrid
     * @method repaint
     * @private
     */
    repaint() {
        var frameHeight = this.frameNode.clientHeight;
        var scrollHeight, spinnerTop;

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

            spinnerTop = this.contentNode.offsetHeight - this.bodyNode.offsetHeight - scrollHeight;
            this.spinnerNode.style.top = spinnerTop + 'px';
            this.spinnerNode.style.height = this.contentNode.offsetHeight - spinnerTop + 'px';
            this.spinnerNode.style.zIndex = this.getzIndex() + 1;

            this.frameNode.style.zIndex = this.getzIndex() + 1;
            this.frameNode.style.overflowX = 'auto';
            this.frameNode.style.visibility = '';

            this.emitEvent('repaint', this.node);
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
     * Bind all events to the DataGrid node
     * @method bindUI
     * @private
     */
    bindUI() {
        this.on('mousedown', this.onMouseDown);
        this.on('click', this.onClick);

        this.onWindowEvent('resize', this.onWindowResize);
        this.onWindowEvent('mousemove', this.onWindowMouseMove);
        this.onWindowEvent('mouseup', this.onWindowMouseUp);
    }
    /**
     * mousedown event handler
     * @method onMouseDown
     * @private
     */
    onMouseDown(e) {
        if (e.target.classList.contains('fw-datagrid-resizer')) {
            this.mousedown = true;
            this.mouseStartX = e.clientX;
            this.numColResized = e.target.parentNode.parentNode.cellIndex - 1;
        } else if (this.footerNode.contains(e.target) && e.target.classList.contains('fw-datagrid-faction')) {
            if (!e.target.classList.contains('disabled')) {
                e.target.classList.add('activated');
            }
        }
    }
    /**
     * click event handler
     * @method onClick
     * @private
     */
    onClick(e) {
        if (!this.paginatedArraySource || !this.enabled) return;

        var index, column;
        var headerNode, nodes, orderAsc;
        var n, l;
        var page, maxPages;
        var numCol, numRow;

        if (this.headerNode.contains(e.target)) {
            if (e.target.classList.contains('fw-datagrid-header')) {
                headerNode = e.target.parentNode;
                index = headerNode.cellIndex;
            } else if (e.target.classList.contains('fw-datagrid-hlabel')) {
                headerNode = e.target.parentNode.parentNode;
                index = headerNode.cellIndex;
            } else if (e.target.classList.contains('fw-datagrid-sortable')) {
                headerNode = e.target;
                index = headerNode.cellIndex;
            } else {
                return;
            }

            column = this.columns[index];

            if (column.sortable) {
                nodes = this.headerNode.getElementsByTagName('th');

                for (n = 0, l = nodes.length; n < l; n++) {
                    nodes[n].classList.remove('asc');
                    nodes[n].classList.remove('desc');
                }

                orderAsc = this.paginatedArraySource.order === column.property ? !this.paginatedArraySource.orderAsc : true;
                headerNode.classList.add(orderAsc ? 'asc' : 'desc');
                this.paginatedArraySource.load({ order: column.property,  orderAsc: orderAsc });
            }

        } else if (
            this.enabled &&
            this.footerNode.contains(e.target.parentNode) &&
            e.target.parentNode.hasClass('fw-datagrid-faction')) {

            page = this.paginatedArraySource.page;
            maxPages = this.paginatedArraySource.maxPages;

            if (e.target.parentNode.classList.contains('go-first')) {
                if (page > 1) { this.paginatedArraySource.getFirstPage(); }
            } else if (e.target.parentNode.classList.contains('go-last')) {
                if (page < maxPages) { this.paginatedArraySource.getLastPage(); }
            } else if (e.target.parentNode.classList.contains('go-previous')) {
                if (page > 1) { this.paginatedArraySource.getPreviousPage(); }
            } else if (e.target.parentNode.classList.contains('go-next')) {
                if (page < maxPages) { this.paginatedArraySource.getNextPage(); }
            }
        } else if (
            this.bodyNode.contains(e.target) &&
            e.target.classList.contains('fw-datagrid-baction')) {

            index = e.target.parentNode.cellIndex;
            numCol = e.target.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.cellIndex;
            numRow = e.target.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.rowIndex - 1;

            if (fw.isFunction(this.columns[numCol].actions[index].onClick)) {
                this.columns[numCol].actions[index].onClick(this.paginatedArraySource.source.get(numRow), numRow);
            }
        }
    }
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
     * Build the DataGrid header
     * @method buildHeader
     * @private
     */
    buildHeader() {
        var rowHTML = [];
        var order = null;
        var orderAsc = true;
        var resizerZIndex = this.getzIndex() + 1;
        var classNames, column, cell, header, n, l;

        if (this.paginatedArraySource) {
            order = this.paginatedArraySource.order;
            orderAsc = this.paginatedArraySource.orderAsc;
        }

        for (n = 0, l = this.columns.length; n < l; n++) {
            classNames = [];
            column = this.columns[n];
            cell = '<th class="';
            header = this.createMessage(column.header);

            if (column.sortable) {
                classNames.push('fw-datagrid-sortable');

                if (order === column.property) {
                    classNames.push(orderAsc ? 'asc' : 'desc');
                }
            }

            cell += classNames.join(' ');
            cell += '" style="width:' + column.width + 'px"';
            cell += '><div class="fw-datagrid-header">';

            if (n > 0) {
                cell += '<div class="fw-datagrid-resizer" style="z-index:' + resizerZIndex + '"></div>';
            }

            cell += '<div class="fw-datagrid-hlabel">' + header + '</div></div></th>';
            rowHTML.push(cell);
        }

        this.headerNode.innerHTML = '<tr>' + rowHTML.join('') + '<th class="last"><div class="fw-datagrid-header"><div class="fw-datagrid-resizer" style="z-index:' + resizerZIndex + '"></div><div>&nbsp;</div></div></th><th class="expandable"><div></div></th></tr>';
    }
    /**
     * Build the DataGrid body
     * @method buildBody
     * @private
     */
    buildBody() {
        var self = this;
        var rowsHTML = [];
        var i = 0;
        var rowHTML, n, l;

        if (this.paginatedArraySource) {
            this.paginatedArraySource.getSource().forEach(function (index, item) {
                rowsHTML.push(self.getRow(item));
                i++;
            });
        }

        for (; i < this.size; i++) {
            rowHTML = ['<tr class="fw-datagrid-row">'];

            for (n = 0, l = this.columns.length; n < l; n++) {
                rowHTML.push('<td class="fw-datagrid-cell"><div class="fw-datagrid-empty">&nbsp;</div></td>');
            }

            rowHTML.push('<td><div class="fw-datagrid-empty">&nbsp;</div></td><td><div class="fw-datagrid-empty">&nbsp;</div></td></tr>');
            rowsHTML.push(rowHTML.join(''));
        }

        this.bodyNode.innerHTML = rowsHTML.join('');
    }
    /**
     * Get cell (for building the data grid body)
     * @method
     * @private
     * @param {Object} item
     * @param {number} column
     * @return {string} cell
     */
    getCell(item, column) {
        if (!this.paginatedArraySource) return '<div class="fw-datagrid-empty">&nbsp;</div>';

        var cell, value, n, l, actionLabel;

        if (column.actions instanceof Array) {
            cell = '<div class="fw-datagrid-bactions"><table cellspacing="0" cellpadding="0"><tbody><tr>';

            for (n = 0, l = column.actions.length; n < l; n++) {
                actionLabel = this.createMessage(column.actions[n].value);
                cell += '<td><div class="fw-datagrid-baction">' + actionLabel + '</div></td>';
            }

            cell += '</tr></tbody></table></div>';
        } else {
            value = item.get(column.property);

            switch (column.type) {
                case 'timestampLabel':
                    cell = '<div class="fw-datagrid-blabel">' + value.toDMYHMSString() + '</div>';
                    break;
                case 'dateLabel':
                    cell = '<div class="fw-datagrid-blabel">' + value.toDMYString() + '</div>';
                    break;
                case 'numberLabel':
                    cell = '<div class="fw-datagrid-blabel">' + value.toString({ decimals: column.decimals }) + '</div>';
                    break;
                case 'currencyLabel':
                    cell = '<div class="fw-datagrid-blabel">' + value.toString() + '</div>';
                    break;
                default:
                    if (fw.isValidNumber(value)) {
                        value = String(value);
                    } else if (value && fw.isFunction(value.toString)) {
                        if ((value = value.toString()).length === 0) {
                            value = '&nbsp;';
                        }
                    } else {
                        value = '&nbsp;';
                    }

                    cell = '<div class="fw-datagrid-blabel">' + value + '</div>';
            }
        }

        return cell;
    }
    /**
     * Get row (for building the data grid body)
     * @method getRow
     * @private
     * @param {Object} item
     * @return {string} row
     */
    getRow(item) {
        var rowHTML = ['<tr class="fw-datagrid-row">'];
        var n, l;

        for (n = 0, l = this.columns.length; n < l; n++) {
            rowHTML.push('<td class="fw-datagrid-cell">');
            rowHTML.push(this.getCell(item, this.columns[n]));
            rowHTML.push('</td>');
        }

        rowHTML.push('<td><div class="fw-datagrid-empty">&nbsp;</div></td><td><div class="fw-datagrid-empty">&nbsp;</div></td></tr>');

        return rowHTML.join('');
    }
    /**
     * Build the DataGrid footer
     * @method buildFooter
     * @private
     */
    buildFooter() {
        var page = 0;
        var maxPages = 0;
        var size = 0;

        if (this.paginatedArraySource) {
            page = this.paginatedArraySource.page;
            maxPages = this.paginatedArraySource.maxPages;
            size = this.paginatedArraySource.count;
        }

        this.footerNode.innerHTML = '<table>\
            <tbody>\
                <tr>\
                    <td class="fw-datagrid-faction go-first' + ((page > 1) ? '"' : ' disabled"') + '><div></div></td>\
                    <td class="fw-datagrid-faction go-previous' + ((page > 1) ? '"' : ' disabled"') + '><div></div></td>\
                    <td class="fw-datagrid-faction go-next' + ((page < maxPages) ? '"' : ' disabled"') + '><div></div></td>\
                    <td class="fw-datagrid-faction go-last' + ((page < maxPages) ? '"' : ' disabled"') + '><div></div></td>\
                    <td class="fw-datagrid-finfo"><div>' + ((size > 0) ? (this.createMessage('results') + page + ' - ' + maxPages + this.createMessage('on') + size) : this.createMessage('noResult')) + '</div></td>\
                </tr>\
            </tbody>\
        </table>';
    }
    /**
     * Refresh the DataGrid
     * @method refresh
     */
    refresh() {
        if (this.enabled) {
            this.buildHeader();
            this.buildBody();
            this.buildFooter();
            this.repaint();
        }
    }
    /**
     * Show the spinner
     * @method showSpinner
     * @private
     */
    showSpinner() {
        if (this.isAttached) {
            this.spinnerNode.style.display = 'block';
        } else {
            this.activateSpinner = true;
        }
    }
    /**
     * Hide the spinner
     * @method hideSpinner
     * @private
     */
    hideSpinner() {
        this.activateSpinner = false;

        if (this.spinnerNode.style.display !== 'none') {
            this.spinnerNode.style.display = 'none';
        }
    }
}

module.exports = DataGrid;
