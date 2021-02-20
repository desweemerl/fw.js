/**
 * @module fw/dom
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var FwPromise = require('./Promise');

var dom = {
    /**
     * Wait until document is ready
     * @function documentReady
     * @return {fw/Promise}
     */
    documentReady: function() {
        return new FwPromise(function(resolve, reject) {
            var loaded = false;

            function handler() {
                if (!loaded) {
                    loaded = true;
                    resolve();
                }
            }

            document.addEventListener('DOMContentLoaded', handler, false);
            window.addEventListener('load', handler, false);

            if (document.readyState === 'complete') {
                loaded = true;
                resolve();
            }
        });
    },
    /**
     * Create a custom event
     * @function createCustomEvent
     * @param {string} name - event name
     * @param {boolean} canBubble - set the event bubble inside the DOM
     * @param {boolean} cancelable - set the event cancelable
     * @param {*} detail - data passed to the event
     * @return {CustomEvent}
     */
    createCustomEvent: function(name, canBubble, cancelable, detail) {
        var e = document.createEvent('CustomEvent');

        e.initCustomEvent(name, canBubble, cancelable, detail);

        return e;
    },
    /**
     * Empty an empty DOM node
     * @function emptyNode
     * @param {Node} node - DOM node to be empty
     */
    emptyNode: function(node) {
        if (!(node instanceof Node)) return;

        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    },
    /**
     * Get offset of a DOM node
     * @function getOffset
     * @param {Node} node - DOM node from which we want to retrieve offset
     * @return {Object} offset - offset of the DOM node
     * @return {number} offset.top - top position of the DOM node
     * @return {number} offset.left - left position of the DOM node
     */
    getOffset: function(node) {
        var doc = node.ownerDocument;
        var docElem = doc.documentElement;
        var win = doc.defaultView;
        var box = { top: 0, left: 0 };

        if (!docElem.contains(node)) return box;

        if (typeof node.getBoundingClientRect === 'function') {
            box = node.getBoundingClientRect();
        }

        return {
            top:  box.top + win.pageYOffset - docElem.clientTop,
            left: box.left + win.pageXOffset - docElem.clientLeft
        };
    },
    /**
     * Get the zIndex of a DOM node
     * @function getZIndex
     * @param {Node} node - DOM node from which we want to retrieve index
     * @return {number} zIndex
     */
    getZIndex: function(node) {
        if (node === window) return 0;
        var zIndex = 0;
        var n = 0;

        do {
            n = node.style.zIndex;

            if (n !== 'auto' && n !== '') {
                zIndex = Number(n);
                break;
            }

            node = node.parentNode;

        } while (node !== null && node !== document);

        return zIndex;
    },
    /**
     * Get the scrollbar sizes
     * @function getScrollbarSizes
     * @return {Object} sizes - scrollbars sizes
     * @return {number} sizes.width - scrollbars width
     * @return {number} sizes.height - scrollbars height
     */
    getScrollbarSizes: function() {
        var node = document.createElement('div');
        var widthWithScroll, heightWithScroll;

        node.style.display = 'block';
        node.style.position = 'absolute';
        node.style.visibility = 'hidden';
        node.style.width = '100px';
        node.style.height = '100px';
        node.style.top = '-100px';
        node.style.left = '-100px';
        document.body.appendChild(node);
        node.style.overflow = 'scroll';
        widthWithScroll = node.scrollWidth;
        heightWithScroll = node.scrollHeight;
        document.body.removeChild(node);

        return {
            width:  100 - widthWithScroll,
            height: 100 - heightWithScroll
        };
    },
    /**
     * Set the focus on a node or on the first focusable child node
     * @method focus
     * @params {Node} targetNode - node to be focused
     */
    focus: function(targetNode) {
        var nodes, node, style, firstNode, n, l;

        function tryFocusOnNode(node) {
            if (node.tabIndex !== -1) {
                switch (node.tagName) {
                    case 'INPUT':
                        if (node.type !== 'hidden' && !node.readOnly && !node.disabled && window.getComputedStyle(node).visibility !== 'hidden') {
                            node.focus();
                            return true;
                        }
                        break;
                    case 'TEXTAREA':
                    case 'SELECT':
                        if (!node.readOnly && !node.disabled && window.getComputedStyle(node).visibility !== 'hidden') {
                            node.focus();
                            return true;
                        }
                        break;
                    default:
                        if (window.getComputedStyle(node).visibility !== 'hidden') {
                            node.focus();
                            return true;
                       }
                }
            }

            return false;
        }

        if (targetNode instanceof Node && targetNode.nodeType === 1) {
            if (tryFocusOnNode(targetNode)) return true;
            nodes = targetNode.getElementsByTagName('*');

            for (n = 0, l = nodes.length; n < l; n++) {
                node = nodes[n];
                if (tryFocusOnNode(node)) return true;
            }
        }

        return false;
    }
};

module.exports = dom;
