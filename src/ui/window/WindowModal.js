/**
 * @module fw/ui/window/WindowModal
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var ElementModal = require('../ElementModal');
var fw = require('../../Core');
var FwNode = require('../Node');
var i18nWindowModal = require('../../nls/windowmodal');

var windowModalBg = null;
var windowModalBgZIndex = null;
var windowsModal = [];

/**
 * Create a window modal
 * @class
 * @alias module:fw/ui/window/WindowModal
 * @augments fw/ui/Element
 * @param {Object} [config] - the configuration object of the window modal
 * @param {boolean} [config.maxSize] - set the window modal to the maximum size (expandable)
 * @param {number} [config.width] - set the window modal width
 * @param {string} [config.title] - set the window modal title
 * @param {Node|fw/ui/Node} [config.contentNode] - set the content node of the window modal
 */
class FwWindowModal extends ElementModal {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-windowmodal'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-windowmodal'; // jshint ignore:line
    /**
     * define the i18n dictionaries
     * @property i18n
     */
    static i18n = i18nWindowModal; // jshint ignore:line
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */  
    initialize() {
        super.initialize();
        this.title = null;
        this.configContentNode =  this.config.contentNode || null;
        this.maxSize = this.config.maxSize || false;

        if (fw.isValidNumber(this.config.width)) this.width = this.config.width;
    }
    /**
     * Process this.config.node
     * @method processNode
     * @param {Node} node
     */
    processNode(node) {
        if (node.firstChild instanceof Node) {
            this.configContentNode = node.firstChild;
        }
    }
    /**
     * Create the WindowModal nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node.setAttribute('tabindex', '0');
        this.node.cellSpacing = 0;
        this.node.cellPadding = 0;
        this.node.innerHTML = '\
            <div class="fw-windowmodal-top">\
                <div class="fw-windowmodal-title"></div>\
                <div class="fw-windowmodal-close"></div>\
            </div>\
            <div class="fw-windowmodal-main">\
                <div class="fw-windowmodal-scroll"></div>\
            </div>';

        this.topNode = this.node.getElementsByClassName('fw-windowmodal-top')[0];
        this.titleNode = this.node.getElementsByClassName('fw-windowmodal-title')[0];
        this.closeNode = this.node.getElementsByClassName('fw-windowmodal-close')[0];
        this.mainNode = this.node.getElementsByClassName('fw-windowmodal-main')[0];
        this.scrollNode = this.node.getElementsByClassName('fw-windowmodal-scroll')[0];

        this.setTitle(this.config.title);
        this.setContentNode(this.configContentNode);
    }
    /** 
     * Focus on first focusable element in the window modal
     * @method focus
     */ 
    focus() {
        if (!this.node.contains(document.activeElement) && !fw.focus(this.contentNode)) {
            this.node.focus();
        }
    }
    /**
     * Set content node
     * @method setContentNode
     * @param {Node|fw/ui/Node} contentNode
     */
    setContentNode(contentNode) {
        if (contentNode instanceof FwNode) {
            contentNode = contentNode.node;
        }

        if (contentNode instanceof Node && this.contentNode instanceof Node) {
            this.scrollNode.replaceChild(contentNode);
            this.contentNode = contentNode;
            this.repaint();

            return;
        }

        this.contentNode = contentNode;
            
        this.scrollNode.appendChild(this.contentNode);
        this.repaint();
    }
    /**
     * Get content node
     * @method getContentNode
     */
    getContentNode() {
        return this.contentNode;
    }
    /**
     * Bind all events to the WindowModal nodes
     * @method bindUI
     * @private
     */
    bindUI() {
        super.bindUI();

        this.on('click', this.onClick);
        this.onAttributeChange('title', this.setTitle);
    }
    /**
     * click event handler
     * @method onClick
     * @private
     */
    onClick(e) {
        if (e.target === this.closeNode) {
            this.hide();
        }
    }
    /**
     * Set the WindowModal title
     * @method setTitle
     * @param {string} title
     */
    setTitle(title) {
        this.title = this.createMessage(title);
        fw.emptyNode(this.titleNode);
        this.titleNode.appendChild(document.createTextNode(this.title));
    }
    /**
     * Repaint the WindowModal
     * @method repaint
     */
    repaint() {
        var windowHeight = window.innerHeight;
        var windowWidth = window.innerWidth;
        var scrollbarSizes = fw.getScrollbarSizes();
        var marginOutside = 10;
        var diffHeight = 2 * marginOutside + this.topNode.offsetHeight;
        var diffMargin = 2 * marginOutside;
        var width, height;

        this.offWindowEvent('resize');

        this.scrollNode.style.height = '';
        this.scrollNode.style.width = '';

        if (this.contentNode instanceof Node && this.contentNode.nodeType === 1) {
            this.contentNode.style.width = '';
        }

        if (this.maxSize) {
            width = windowWidth;
            height = windowHeight;
            this.scrollNode.style.width = String(width - diffMargin) + 'px';
            this.scrollNode.style.height = String(height - diffHeight) + 'px';
        } else {
            if (this.width && this.contentNode instanceof Node && this.contentNode.nodeType === 1) {
                this.scrollNode.style.width = String(this.width - 2 * scrollbarSizes.width) + 'px';
            }

            width = this.node.offsetWidth;
        }

        if (width + diffMargin > windowWidth) {
            if (this.width && this.contentNode instanceof Node && this.contentNode.nodeType === 1) {
                this.contentNode.style.width = String(this.width - 2 * scrollbarSizes.width) + 'px';
            }

            if (windowWidth > diffMargin) {
                width = windowWidth - diffMargin;
                this.scrollNode.style.width = String(width) + 'px';
                this.node.style.left = String(marginOutside) + 'px';
            } else {
                width = diffMargin;
                this.scrollNode.style.width = String(width) + 'px';
                this.node.style.left = String(-width / 2) + 'px';
            }
        } else {
            this.node.style.left = String((windowWidth - this.node.offsetWidth) / 2) + 'px';
        }

        if (this.height === undefined) {
            height = this.node.offsetHeight;
        }

        if (height + diffMargin > windowHeight) {
            if (windowHeight > diffMargin) {
                this.scrollNode.style.height = String(windowHeight - diffHeight) + 'px';
                this.node.style.top = String(marginOutside) + 'px';
            } else {
                this.scrollNode.style.height = String(diffHeight) + 'px';
                this.node.style.top = String(-diffHeight / 2) + 'px';
            }
        } else {
            this.node.style.top = String((windowHeight - this.node.offsetHeight) / 2) + 'px';
        }

        this.onWindowEvent('resize', this.onWindowResize);
    }
}

module.exports = FwWindowModal;
