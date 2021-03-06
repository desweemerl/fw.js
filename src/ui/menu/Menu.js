/**
 * @module fw/ui/menu/Menu
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var fw = require('../../Core');
var FwElement = require('../Element');
var Message = require('fw/i18n/Message');

/**
 * Create a menu element
 * @class
 * @alias module:/fw/ui/menu/VerticalMenu
 * @augments fw/ui/Element
 * @param {Object} [config] - the configuration object of the menu
 * @param {string} [type='horizontal'] - menu type ('horizontal' or 'vertical')
 * @param {function} [config.onClick] - define an onClick event function
 */
class FwMenu extends FwElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-menu'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-menu'; // jshint ignore:line
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */
    initialize() {
        this.menu = null;
        this.selectedIndex = null;
    }
    /**
     * Create the vertical menu nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.ulNode = document.createElement('ul');
        this.node.appendChild(this.ulNode);
        this.setMenuType(this.config.type);
        this.createMenu(this.config.menu);
    }
    /**
     * Bind all events to the VerticalMenu Node
     * @method bindUI
     * @private
     */
    bindUI() {
        this.on('click', this.onClick);

        this.onAttributeChange('type', this.setMenuType);
    }
    /**
     * click event handler
     * @method onClick
     * @private
     */
    onClick(e) {
        if (e.target.nodeName === 'LI') {
            if (e.target.index === undefined) return;
            this.selectMenu(e.target.index, this.config.onClick);
        } else if (e.target.nodeName === 'SPAN') {
            if (e.target.parentNode.index === undefined) return;
            this.selectMenu(e.target.parentNode.index, this.config.onClick);
        }
    }
    /**
     * Create a menu
     * @method createMenu
     * @param {Array.<{label: string|fw/i18n/Message}>|{title: string|fw/i18n/Message, items: Array.<{label: string|fw/i18n/Message}>}} menu - entries for the menu
     */
    createMenu(menu) {
        var index = 0;
        var n, l, item, liNode, spanNode;

        this.menu = null;
        fw.emptyNode(this.ulNode);

        switch(this.type) {
            case 'vertical':
                if (!fw.isPureObject(menu)) return;

                if (fw.isString(menu.title) || menu.title instanceof Message) {
                    spanNode = document.createElement('span');
                    spanNode.classList.add('fw-menu-label');
                    spanNode.appendChild(document.createTextNode(this.createMessage(menu.title)));
                    liNode = document.createElement('li');
                    liNode.classList.add('fw-menu-title');
                    liNode.appendChild(spanNode);
                    this.ulNode.appendChild(liNode);
                }

                if (fw.isArray(menu.items)) {
                    for (n = 0, l = menu.items.length; n < l; n++) {
                        item = menu.items[n];

                        if (fw.isString(item.label) || item.label instanceof Message) {
                            spanNode = document.createElement('span');
                            spanNode.classList.add('fw-menu-label');
                            spanNode.appendChild(document.createTextNode(this.createMessage(item.label)));
                            liNode = document.createElement('li');
                            liNode.classList.add('fw-menu-item');
                            liNode.appendChild(spanNode);
                            liNode.index = index++;
                            this.ulNode.appendChild(liNode);
                        }
                    }
                }

                this.menu = menu;
                break;
            default:
                if (!fw.isArray(menu)) return;

                this.menu = { items: [] };

                for (n = 0, l = menu.length; n < l; n++) {
                    item = menu[n];

                    if (fw.isString(item.label) || item.label instanceof Message) {
                        liNode = document.createElement('li');
                        liNode.classList.add('fw-menu-item');
                        liNode.appendChild(document.createTextNode(this.createMessage(item.label)));
                        liNode.index = n;
                        this.ulNode.appendChild(liNode);
                        this.menu.items.push(item);
                    }
                }
        }

        this.selectedIndex = null;
    }
    /**
     * Called when an onClick event occurs on an menu entry
     * @method selectMenu
     * @param {number} index
     * @param {function} handler
     * @private
     */
    selectMenu(index, handler) {
        if (this.selectedIndex === index) return;

        var selected = this.ulNode.getElementsByClassName('selected')[0];
        var liNode = this.ulNode.childNodes[this.menu.title ? index + 1 : index];

        if (liNode !== undefined) {
            this.selectedIndex = index;

            if (selected !== undefined) {
                selected.classList.remove('selected');
            }

            liNode.classList.add('selected');

            if (fw.isFunction(handler)) {
                handler(this.menu.items[index]);
            }
        } else {
            this.selectedIndex = null;
        }
    }
    /**
     * Retrieve the selected item
     * @method getSelectedItem
     * @return {Object}
     */
    getSelectedItem() {
        return this.selectedIndex === null ? null : this.menu.items[this.selectedIndex];
    }
    /**
     * Set menu type ('horizontal' or 'vertical')
     * @method setMenuType
     * @param {string} type
     */
    setMenuType(type) {
        switch(type) {
            case 'vertical':
                this.type = type;
                this.removeClass('horizontalMenu');
                this.addClass('verticalMenu');
                break;
            default:
                this.type = 'horizontal',
                this.removeClass('verticalMenu');
                this.addClass('horizontalMenu');
        }
    }
}

module.exports = FwMenu;
