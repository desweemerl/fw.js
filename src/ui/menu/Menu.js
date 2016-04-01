/**
 * @module fw/ui/menu/Menu
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var fw = require('../../Core');
var FwElement = require('../Element');

/**
 * Create a menu element
 * @class
 * @alias module:/fw/ui/menu/VerticalMenu
 * @augments fw/ui/Element
 * @param {Object} [config] - the configuration object of the menu
 * @param {number} [type=Menu.HORIZONTAL] - menu type (HORIZONTAL or VERTICAL)
 * @param {function} [config.onClick] - define an onClick event function
 */
class FwMenu extends FwElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-menu'; // jshint ignore:line
    /**
     * Define menu HORIZONTAL const
     */
    static HORIZONTAL = 0; // jshint ignore:line
    /**
     * Define menu VERTICAL const
     */
    static VERTICAL = 1; // jshint ignore:line
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */  
    initialize() {
        this.menu = null;
        this.onClick = this.config.onClick || null;
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
            this.selectMenu(e.target.index, this.onClick);
        } else if (e.target.nodeName === 'SPAN') {
            if (e.target.parentNode.index === undefined) return;
            this.selectMenu(e.target.parentNode.index, this.onClick);
        }
    }
    /**
     * Create a menu
     * @method createMenu
     * @param {Array.<{label: string}>|{title: string, items: Array.<{label: string}>}} menu - entries for the menu
     */
    createMenu(menu) {
        var index = 0;
        var n, l, item, liNode, spanNode;

        this.menu = null;
        fw.emptyNode(this.ulNode);

        switch(this.type) {
            case FwMenu.VERTICAL:
                if (!fw.isObject(menu)) return;

                if (fw.isString(menu.title)) {
                    spanNode = document.createElement('span');
                    spanNode.classList.add('label');
                    spanNode.appendChild(document.createTextNode(this.createMessage(menu.title)));
                    liNode = document.createElement('li');
                    liNode.appendChild(spanNode);
                    liNode.classList.add('title');
                    this.ulNode.appendChild(liNode);
                }

                if (fw.isArray(menu.items)) {
                    for (n = 0, l = menu.items.length; n < l; n++) {
                        item = menu.items[n];

                        if (fw.isString(item.label)) {
                            spanNode = document.createElement('span');
                            spanNode.classList.add('label');
                            spanNode.appendChild(document.createTextNode(this.createMessage(item.label)));
                            liNode = document.createElement('li');
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

                for (n = 0, l = menu.length; n < l; n++) {
                    liNode = document.createElement('li');
                    liNode.appendChild(document.createTextNode(this.createMessage(menu[n].label)));
                    liNode.index = n;
                    this.ulNode.appendChild(liNode);
                }

                this.menu = menu;
        }

        if (fw.isString(this.menu.title)) {
            spanNode = document.createElement('span');
            spanNode.classList.add('label');
            spanNode.appendChild(document.createTextNode(this.createMessage(menu.title)));
            liNode = document.createElement('li');
            liNode.appendChild(spanNode);
            liNode.classList.add('title');
            this.ulNode.appendChild(liNode);
        }

        if (fw.isArray(this.menu.items)) {
            for (n = 0, l = menu.items.length; n < l; n++) {
                item = menu.items[n];

                if (fw.isString(item.label)) {
                    spanNode = document.createElement('span');
                    spanNode.classList.add('label');
                    spanNode.appendChild(document.createTextNode(this.createMessage(item.label)));
                    liNode = document.createElement('li');
                    liNode.appendChild(spanNode);
                    liNode.index = index++;
                    this.ulNode.appendChild(liNode);
                }
            }
        }
    }
    /**
     * Called when an onClick event occurs on an menu entry
     * @param {number} index
     * @param {function} handler
     * @private
     */
    selectMenu(index, handler) {
        var selected = this.ulNode.getElementsByClassName('selected')[0];
        var liNode = this.ulNode.childNodes[fw.isString(this.menu.title) ? index + 1 : index];

        if (liNode !== undefined) {
            if (selected !== undefined) {
                selected.classList.remove('selected');
            }

            liNode.classList.add('selected');

            if (fw.isFunction(handler)) {
                handler(this.menu.items[index]);
            }
        }
    }
    /**
     * Set menu type (HORIZONTAL or VERTICAL)
     * @method setMenuType
     * @param {number|string} type
     */
    setMenuType(type) {
        switch(type) {
            case 'vertical':
            case FwMenu.VERTICAL:
                this.type = type;
                this.removeClass('horizontalMenu');
                this.addClass('verticalMenu');
                break;
            default:
                this.type = FwMenu.HORIZONTAL;
                this.removeClass('verticalMenu');
                this.addClass('horizontalMenu');
        }
    }
}

module.exports = FwMenu;
