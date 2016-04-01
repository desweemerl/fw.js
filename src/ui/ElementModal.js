/**
 * @module fw/ui/ElementModal
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var fw = require('../Core');
var FwElement = require('./Element');
var FwNode = require('fw/ui/Node');

var nodesToFocus = [];
var elementsModal = [];
var elementModalBgZIndex;
var elementModalBg = document.createElement('div');

elementModalBg.classList.add('elementModalBg');

class ElementModal extends FwElement {
    /**    
     * Initialize the element modal
     * @method initialize
     * @private
     */
    initialize() {
        if (this.config.onBeforeShow) this.onBeforeShow = this.config.onBeforeShow;
        if (this.config.onBeforeHide) this.onBeforeHide = this.config.onBeforeHide;
        if (this.config.onBeforeDestroy) this.onBeforeDestroy = this.config.onBeforeDestroy;               
    }
    /**
     * Create the element modal nodes
     * @method buildUI
     * @private
     */
    bindUI() {
        this.onWindowEvent('resize', this.onWindowResize);
    }
    /**
     * resize window event handler
     * @method onWindowResize
     * @private
     */
    onWindowResize() {
        elementModalBg.style.width = String(window.screen.width) + 'px';
        elementModalBg.style.height = String(window.screen.height) + 'px';
        this.repaint();
    }
    /**
     * focus window event handler
     * @method onWindowFocus
     * @private
     */
    onWindowFocus(e) {
        if (e.target && e.target !== window && !this.node.contains(e.target)) {
            e.stopPropagation();
            this.focus();
        }
    }
    /**
     * Repaint window on child repaint
     * @method onChildRepaint
     * @private
     */
   onChildRepaint(node) {
        if (this.node.contains(node)) {
            this.repaint();
        }
   } 
    /**
     * Trigger an attach event
     * @override
     * @method triggerAttach
     * @private
     */
    triggerAttach() {
        this.show();
        super.triggerAttach();
    }
    /**
     * Trigger a detach event
     * @override
     * @method triggerDetach
     * @private
     */
    triggerDetach() {
        this.hide();
        super.triggerDetach();
    }
    /**
     * Manage an onBeforeShow event
     * @abstract
     * @method onBeforeShow
     */
    onBeforeShow() {}
    /**
     * Manage an onBeforeHide event
     * @abstract
     * @method onBeforeHide
     */
    onBeforeHide() {}
    /**
     * Repaint the element modal
     * @method repaint
     */
    repaint() {}
    /**
     * Attach transient events to the element modal
     * @method attachTransientEvents
     * @private
     */
    attachTransientEvents() {
        this.onWindowEvent('focus', this.onWindowFocus);
        this.onEvent('repaint', this.onChildRepaint);
    }
    /**
     * Detach transient events to the element modal
     * @method detachTransientEvents
     * @private
     */
    detachTransientEvents() {
        this.offWindowEvent('focus');
        this.offEvent('repaint', this.onChildRepaint);
    }
    /**
     * Set the focus on the element modal 
     * @abstract
     * @method focus
     */
    focus() {
        if (!this.node.contains(document.activeElement)) {
            this.node.focus();
        }
    }
    /**
     * Show the element modal
     * @method show
     */
    show() {
        var self = this;

        if (elementsModal.indexOf(this) !== -1) return;
        
        var activeElement = document.activeElement;
        var refreshScroll = false;
        var scrollX, scrollY, eScrollY, scrollHeight, scrollWidth, scrollbarSizes, offsetHeight, offsetWidth;

        this.onBeforeShow();

        if (elementsModal.length === 0) {
            scrollHeight = document.body.scrollHeight;
            scrollWidth = document.body.scrollWidth;
            offsetHeight = document.body.offsetHeight;
            offsetWidth = document.body.offsetWidth;

            if (offsetHeight < scrollHeight && offsetWidth < scrollWidth) {
                scrollX = window.pageXOffset;
                scrollY = window.pageYOffset;

                if (scrollX === 0) { scrollX = document.body.scrollLeft || 0; }
                if (scrollY === 0) { scrollY = document.body.scrollTop || 0;  }

                refreshScroll = true;
            }

            if (!elementModalBg.parentNode) {
                document.body.classList.add('elementModalBody');
            }

            document.body.appendChild(elementModalBg);
            elementModalBgZIndex = 10000;
        } else {
            elementsModal[elementsModal.length - 1].detachTransientEvents();
            elementModalBg.style.zIndex = String(++elementModalBgZIndex);
        }

        this.node.style.zIndex = String(++elementModalBgZIndex);
        elementsModal.push(this);
        nodesToFocus.push(activeElement);

        if (this.node.parentNode === null) {
            document.body.appendChild(this.node);
        }

        if (refreshScroll) {
            scrollbarSizes = fw.getScrollbarSizes();
            eScrollY = offsetHeight + scrollY + scrollbarSizes.height + 1 >= scrollHeight ? scrollY - scrollbarSizes.height - 1 : scrollY + scrollbarSizes.height + 1;
            window.scrollTo(scrollX, eScrollY);
            window.scrollTo(scrollX, scrollY);
        }

        elementModalBg.style.width = String(window.screen.width) + 'px';
        elementModalBg.style.height = String(window.screen.height) + 'px';

        this.attachTransientEvents();
        this.repaint();
        this.focus();
    }
    /**
     * Hide the element modal 
     * @method hide
     */
    hide() {
        var index, count;
        var elementModal, nodeToFocus;

        if ((index = elementsModal.indexOf(this)) === -1) return;
        elementModal = elementsModal.splice(index, 1)[0];
        elementModal.detachTransientEvents();
        nodeToFocus = nodesToFocus.splice(index, 1)[0];

        this.onBeforeHide();

        if (this.node.parentNode !== null) {
            this.node.parentNode.removeChild(this.node);
        }

        count = elementsModal.length;

        if (count === 0) {
            if (elementModalBg.parentNode) {
                elementModalBg.parentNode.removeChild(elementModalBg);
            }

            document.body.classList.remove('elementModalBody');
            elementModalBgZIndex = 10000;
        } else if (index === count) {
            elementModal = elementsModal[count - 1];
            elementModal.attachTransientEvents();
            elementModalBgZIndex = fw.getZIndex(elementModal.node) - 1;
            elementModalBg.style.zIndex = String(elementModalBgZIndex);
        } else {
            nodesToFocus[index] = nodeToFocus;
            return;
        }

        if (nodeToFocus instanceof Node) {
            nodeToFocus.focus();
        }
    }
    /**
     * Destroy the element modal 
     * @method destroy
     */
    destroy() {
        if (fw.isFunction(this.onBeforeDestroy)) {
            this.onBeforeDestroy();
        }

        this.hide();
        super.destroy();
    }
}

module.exports = ElementModal;
