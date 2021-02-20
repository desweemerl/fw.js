/**
 * @module fw/ui/panel/TabPanel
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var fw = require('../../Core');
var FwElement = require('../Element');

/**
 * Create a tab panel element
 * @class
 * @alias module:/fw/ui/panel/TabPanel
 * @augments fw/ui/Element
 * @param {Object} [config] - the configuration object of the tab panel
 * @param {function} [config.onClick] - define an onClick event function
 */
class FwTabPanel extends FwElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-tabpanel'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-tabpanel'; // jshint ignore:line   
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */  
    initialize() {
        this.tabs = [];
        this.selectedIndex = null;
        this.width = this.config.width || '100%';
    }
    /**
     * Retrieve a tab by its name
     * @method getTabByName
     * @param {string} tabName - tab name
     * @return {Object}
     */
    getTabByName(tabName) {
        if (fw.isEmptyString(tabName)) return;

        var n, l;

        for (n = 0, l = this.tabs.length; n < l; n++) {
            if (this.tabs[n].name === tabName) return this.tabs[n];
        }

        return null;
    }
    /**
     * Process this.config.node
     * @method processNode
     * @param {Node} node
     */
    processNode(node) {
        var tabNodes = node.getElementsByTagName('fw-tab');
        var tabNode, tabTitle, tabName;
        var n, l;

        for (n = 0, l = tabNodes.length; n < l; n++) {
            tabNode = tabNodes[n];
            tabTitle = tabNode.getAttribute('tabtitle');
            tabName = tabNode.getAttribute('tabname');

            if (tabTitle !== null && (tabName !== null ? this.getTabByName(tabName) === null : true)) {
                this.tabs.push({
                    titleNode: null,
                    node:      tabNode,
                    title:     tabTitle,
                    name:      tabName
                });
            }
        }
    }
    /**
     * Create the tab panel nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        var tab, titleNode, contentNode, divNode;
        var n, l;

        this.node.innerHTML = '\
            <div class="fw-tabpanel-selectors-container">\
                <div class="fw-tabpanel-selectors-line"></div>\
                <ul class="fw-tabpanel-selectors"></ul>\
            </div>\
            <div class="fw-tabpanel-bgcontainer">\
                <div class="fw-tabpanel-container"></div>\
            </div>';
        this.node.style.width = this.width;

        this.selectorsNode = this.node.getElementsByClassName('fw-tabpanel-selectors')[0];
        this.containerNode = this.node.getElementsByClassName('fw-tabpanel-container')[0];

        for (n = 0, l = this.tabs.length; n < l; n++) {
            tab = this.tabs[n];
            this.containerNode.appendChild(tab.node);
            divNode = document.createElement('div');
            divNode.classList.add('fw-tabpanel-title');
            divNode.appendChild(document.createTextNode(this.createMessage(tab.title)));
            tab.titleNode = document.createElement('li');
            tab.titleNode.classList.add('fw-tabpanel-title-container');
            tab.titleNode.appendChild(divNode);
            this.selectorsNode.appendChild(tab.titleNode);

            if (this.selectedIndex === null) {
                tab.titleNode.classList.add('selected');
                tab.node.classList.add('selected');
                this.selectedIndex = 0;
            }
        }
    }
    /**
     * Trigger an attach event
     * @method onAttach
     * @private
     */
    onAttach() {
        this.adjustSize();
    }
    /**
     * Bind all events to the TabPanel node
     * @method bindUI
     * @private
     */
    bindUI() {
        this.on('focus', this.onFocus);
        this.on('click', this.onClick);

        this.onEvent('show', this.onShow);
        this.onEvent('repaint', this.onRepaint);
        this.onEvent('invalid', this.onInvalid);
    }
    /**
     * focus event handler
     * @method onFocus
     * @private
     */
    onFocus(e) {
        var n, l;

        if (!this.tabs[this.selectedIndex].node.contains(e.target)) {
            for (n = 0, l = this.tabs.length; n < l; n++) {
                if (this.tabs[n].node.contains(e.target)) {
                    this.selectTab(n);
                    e.preventDefault();
                    return;
                }
            }
        }
    }
    /**
     * click event handler
     * @method onClick
     * @private
     */
    onClick(e) {
        var n, l;

        if (this.selectorsNode.contains(e.target)) {
            for (n = 0, l = this.tabs.length; n < l; n++) {
                if (this.tabs[n].titleNode.contains(e.target)) {
                    if (n !== this.selectedIndex) {
                        this.selectTab(n);
                    }
                    e.preventDefault();
                    return;
                }
            }
        }
    }
    /**
     * show event handler
     * @method onShow
     * @private
     */
    onShow(node) {
        if (node.contains(this.node)) {
            this.adjustSize();
            this.offEvent('show');
            this.onEvent('hide', this.onHide);
        }
    }
    /**
     * hide event handler 
     * @method onHide
     * @private
     */
    onHide(node) {
        if (node.contains(this.node)) {
            this.onEvent('show', this.onShow);
        }
    }
    /**
     * repaint event handler
     * @method onRepaint
     * @private
     */
    onRepaint(node) {
        if (this.node.contains(node)) {
            this.adjustSize();
        }
    }
    /**
     * invalid event handler
     * @method onInvalid
     * @private
     */
    onInvalid(node) {
        var n, l;

        for (n = 0, l = this.tabs.length; n < l; n++) {
            if (this.tabs[n].node.contains(node)) {
                this.selectTab(n);
                return;
            }
        }
    }
    /**
     * Get selected tab name
     * @method getSelectedTabName
     * @return {string} tab name
     */
    getSelectedTabName() {
        return this.tabs[this.selectedIndex].name;
    }
    /**
     * Get selected tab index
     * @method getSelectedTabIndex
     * @return {number} tab index
     */
    getSelectedTabIndex() {
        return this.selectedIndex;
    }
    /**
     * Adjust tab panel size
     * @method adjustSize
     * @private
     */
    adjustSize() {
        var maxHeight, contentNode, n, l;

        this.height = 0;

        for (n = 0, l = this.tabs.length; n < l; n++) {
            contentNode = this.tabs[n].node;
            contentNode.style.height = '';
            maxHeight = contentNode.offsetHeight;

            if (maxHeight > this.height) {
                this.height = maxHeight;
            }
        }

        this.containerNode.style.height = String(this.height) + 'px';

        for (n = 0, l = this.tabs.length; n < l; n++) {
            contentNode = this.tabs[n].node;

            if (n === this.selectedIndex) {
                contentNode.style.height = String(this.height) + 'px';
                contentNode.style.overflow = 'auto';
            } else {
                contentNode.style.height = '0px';
                contentNode.style.overflow = 'hidden';
            }
        }
    }
    /**
     * Select a tab
     * @method selectTab
     * @param {string|index} tab
     * @return {boolean} is tab selected
     */
    selectTab(arg) {
        var tab, tabIndex, selectedTab;

        if (fw.isString(arg)) {
            tab = this.getTabByName(arg);
            if (!tab) return false;
            tabIndex = this.tabs.indexOf(tab);
        } else {
            if (!fw.isValidNumber(arg)) return false;
            tab = this.tabs[arg];
            if (!tab) return false;
            tabIndex = arg;
        }

        if (this.selectedIndex !== null) {
            selectedTab = this.tabs[this.selectedIndex];
            selectedTab.titleNode.classList.remove('selected');
            selectedTab.node.classList.remove('selected');
            selectedTab.node.style.overflow = 'hidden';
            selectedTab.node.style.height = '0px';
        }

        tab.titleNode.classList.add('selected');
        tab.node.classList.add('selected');
        tab.node.style.overflow = 'auto';
        tab.node.style.height = String(this.height) + 'px';
        this.selectedIndex = tabIndex;

        return true;
    }
    /**
     * Append a tab
     * @method appendTab
     * @param {string} [tabName] - tab name
     * @param {string} [tabTitle] - tab title
     * @param {Node} [node] - tab node
     */
    appendTab() {
        var tabName = null;
        var tabTitle, divNode, node, tab;

        if (arguments.length === 2) {
            tabTitle = arguments[0];
            node = arguments[1];
        } else if (arguments.length > 2) {
            tabName = arguments[0];
            tabTitle = arguments[1];
            node = arguments[2];
        } else {
            return;
        }

        if (tabTitle !== null && (tabName !== null ? this.getTabByName(tabName) === null : true)) {
            tab = {
                title: tabTitle,
                name:  tabName
            };

            this.tabs.push(tab);
            tab.node = document.createElement('fw-tab');
            tab.node.appendChild(node);
            this.containerNode.appendChild(tab.node);
            divNode = document.createElement('div');
            divNode.classList.add('fw-tabpanel-title');
            divNode.appendChild(document.createTextNode(this.createMessage(tabTitle)));
            tab.titleNode = document.createElement('li');
            tab.titleNode.classList.add('fw-tabpanel-title-container');
            tab.titleNode.appendChild(divNode);
            this.selectorsNode.appendChild(tab.titleNode);

            if (this.selectedIndex === null) {
                tab.titleNode.classList.add('selected');
                tab.node.classList.add('selected');
                this.selectedIndex = 0;
            }

            if (this.isAttached) {
                this.adjustSize();
            }
        }
    }
    /**
     * Remove a tab
     * @method removeTab
     * @param {string|index} tab
     */
    removeTab(arg) {
        var tab, tabIndex, selectedTab;
        var l;

        if (fw.isString(arg)) {
            tab = this.getTabByName(arg);
            if (!tab) return false;
            tabIndex = this.tabs.indexOf(tab);
        } else {
            if (!fw.isValidNumber(arg)) return false;
            tab = this.tabs[arg];
            if (!tab) return false;
            tabIndex = arg;
        }

        this.containerNode.removeChild(tab.node);
        this.selectorsNode.removeChild(tab.titleNode);
        this.tabsIndex.splice(tabIndex, 1);
        this.tabs.splice(tabIndex, 1);

        l = this.tabs.length;

        if (l > 0) {
            if (this.selectedIndex > tabIndex) {
                this.selectedIndex = this.selectedIndex - 1;
            } else if (this.selectedIndex === tabIndex) {
                this.selectedIndex = null;
                this.selectTab(tabIndex);
            }
        } else {
            this.selectedIndex = null;
        }

        if (this.isAttached) {
            this.adjustSize();
        }
    }
    /**
     * Reset the tab (select the first tab)
     * @method reset
     */
    reset() {
        this.selectTab(0);
    }
}

module.exports = FwTabPanel;
