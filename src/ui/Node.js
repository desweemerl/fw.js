/**
 * @module fw/ui/Node
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */
'use strict';

var ElementFactory = require('./ElementFactory');
var FwElement = require('./Element');
var ModuleError = require('../error/ModuleError');
var Store = require('./Store');
var types = require('../types');

/**
 * Create a Node wrapper
 * @class
 * @alias module:fw/ui/Node
 * @param {Node} node
 */
class FwNode {
    /**
     * @constructor
     */
    constructor(node) {
        if (node instanceof Node) {
            this.node = node;
        } else if (node instanceof FwElement) {
            this.node = node.node;
        } else {
            throw new ModuleError({
                moduleName: 'Node',
                message:    'node is not an instance of Node or fw/ui/Element',
                origin:     'instantiation of node'
            });
        }
    }
    /**
     * Append node or element to node
     * @method append
     * @param {fw/ui/Element|Node|string} child 
     * @return {fw/ui/Node}
     */
    append(child) {
        var node;
        var n, l;

        if (child instanceof FwElement || child instanceof FwNode) {
            if (child.node.parentNode !== null) {
                throw new ModuleError({
                    moduleName: 'Node',
                    message:    'child is already attached on an existing node',
                    origin:     'append function'
                });
            }

            this.node.appendChild(child.node);
        } else if (child instanceof Node) {
            if (child.parentNode !== null) {
                throw new ModuleError({
                    moduleName: 'Node',
                    message:    'child is already attached on an existing node',
                    origin:     'append function'
                });
            }
           
            this.node.appendChild(child);
        } else if (types.isString(child)) {
            node = document.createElement('div');
            node.innerHTML = child;       

            for (n = 0, l = node.childNodes.length; n < l; n++) {
                this.node.appendChild(node[n]);
            }
        } else {
            throw new ModuleError({
                moduleName: 'Node',
                message:    'child is not an instance of Element or Node or FwNode or is not a string',
                origin:     'append function'
            });
        }

        return this;
    }
    /**
     * Prepend node or element to node
     * @method prepend
     * @param {fw/ui/Element|Node|string} child 
     * @return {fw/ui/Node}
     */
    prepend(child) {
        var firstChild = this.node.firstChild;
        var node;
        var n, l;

        if (child instanceof FwElement || child instanceof FwNode) {
            if (child.node.parentNode !== null) {
                throw new ModuleError({
                    moduleName: 'Node',
                    message:    'child is already attached on an existing node',
                    origin:     '"prepend" method'
                });
            }

            if (firstChild) {
                this.node.insertBefore(child.node, firstChild);
            } else {
                this.node.appendChild(child.node);
            }
        } else if (child instanceof Node) {
            if (child.parentNode !== null) {
                throw new ModuleError({
                    moduleName: 'Node',
                    message:    'child is already attached on an existing node',
                    origin:     '"prepend" method'
                });
            }

            if (firstChild) {
                this.node.insertBefore(child, firstChild);
            } else {
                this.node.appendChild(child);
            }
        } else if (types.isString(child)) {
            node = document.createElement('div');
            node.innerHTML = child;       

            if (firstChild) {
                for (n = 0, l = node.childNodes.length; n < l; n++) {
                    this.node.insertBefore(node[n], firstChild);
                }
            } else {
                for (n = 0, l = node.childNodes.length; n < l; n++) {
                    this.node.appendChild(node[n]);
                }
            }
        } else {
            throw new ModuleError({
                moduleName: 'Node',
                message:    'child is not an instance of Element or Node or FwNode or is not a string',
                origin:     '"prepend" method'
            });
        }

        return this;
    }   
    /**
     * Detach from parent node
     * @method detach
     * @return {fw/ui/Node}
     */
    detach() {
        if (this.node.parentNode !== null) {
            this.node.parentNode.removeChild(this.node);
        }

        return this;
    }
    /**
     * Replace this node with an other one
     * @method replaceWith
     * @param {fw/ui/Element|fw/ui/Node|Node} node 
     * @return {fw/ui/Node}
     */
    replaceWith(node) {
        if (this.node.parentNode === null) {
            throw new ModuleError({
                moduleName: 'Node',
                message:    'node has not parent',
                origin:     'replaceWith function'
            });
        }

        if (node instanceof FwElement || node instanceof FwNode) {
            node = node.node;
        }

        if (!(node instanceof Node)) {
            throw new ModuleError({
                moduleName: 'Node',
                message:    'node is not an instance of Element or Node or FwNode',
                origin:     'replaceWith function'
            });
        }

        if (this.node !== node) {    
            this.node.parentNode.replaceChild(this.node, node);
        }

        return this;
    }
    /**
     * Append HTML content to node
     * @method html
     * @param {fw/ui/Store} store - Element store
     * @param {string} HTML - HTML content
     * @param {Object} [sharedConfig]
     * @param {Object} [config]
     * @return {fw/ui/Node}
     */
    html() {
        var HTML;
        var optStore, store;
        var sharedConfig, config;

        switch (arguments.length) {
            case 1:
                HTML = arguments[0];
                break;
            case 2:
                if (arguments[0] instanceof Store) {
                    optStore = arguments[0];
                } else if (!types.isEmptyString(arguments[0])) {
                    HTML = arguments[0];
                }

                if (!HTML) {
                    HTML = arguments[1];
                } else {
                    config = arguments[1];
                }
                break;
            case 3:
                if (arguments[0] instanceof Store) {
                    optStore = arguments[0];
                } else if (!types.isEmptyString(arguments[0])) {
                    HTML = arguments[0];
                }

                if (!HTML) {
                    HTML = arguments[1];
                } else {
                    sharedConfig = arguments[1];
                }

                config = arguments[2];
                break;
            default:
                optStore = arguments[0];
                HTML = arguments[1];
                sharedConfig = arguments[2];
                config = arguments[3];
        }

        store = sharedConfig ? 
            ElementFactory.html(this.node, HTML, sharedConfig, config) : 
                ElementFactory.html(this.node, HTML, config);

                if (optStore) {
                    optStore.merge(store);
                }

                return this;
    }
    /**
     * Return element of the node if exists
     * @method el
     * @return {fw/ui/Element|null} FwElement if exists
     */
    el() {
        return this.node.fwElement ? this.node.fwElement : null;
    }
    /**
     * Add class to node
     * @method addClass
     * @param {string} className - class name
     * @return {fw/ui/Node}
     */
    addClass(className) {
        if (!types.isEmptyString(className)) {
            this.node.classList.add(className);
        }

        return this;
    }
    /**
     * Remove class from node
     * @method removeClass
     * @param {string} className - class name
     * @return {fw/ui/Node}
     */
    removeClass(className) {
        if (!types.isEmptyString(className)) {
            this.node.classList.remove(className);
        }

        return this;
    }
    /**
     * Get a node by its id
     * @method getById
     * @param {string} id - id node
     * @return {fw/ui/Node}
     */
    getById(id) {
        return this.node.getElementById(id);
    }
    /**
     * Get nodes by their class name
     * @method getByClass
     * @param {string} className - nodes class name
     * @return {FwNodes}
     */
    getByClass(className) {
        return new FwNodes(this.node.getElementsByClassName(className));
    }
    /**
     * Get nodes by their tag name
     * @method getByTag
     * @param {string} tagName - nodes tag name
     * @return {FwNodes}
     */
    getByTag(tagName) {
        return new FwNodes(this.node.getElementsByTagName(tagName))
    }  
    /**
     * Get nodes by their name
     * @method getByName
     * @param {string} name - name
     * @return {FwNodes}
     */
    getByName(name) {
        return new FwNodes(this.node.querySelectorAll('[name=' + name + ']'));
    }
    /**
     * Get all children nodes
     * @method children
     * @return {FwNodes}
     */
    children() {
        return new FwNodes(this.node.childNodes);
    }
    /**
     * Remove all children nodes
     * @method empty
     * @return {fw/ui/Node}
     */
    empty() {
        while (this.node.firstChild) {
            this.node.removeChild(this.node.firstChild);
        } 

        return this;
    }
}
/**
 * Create Nodes array wrapper
 * @class FwNodes
 * @private
 * @param {Node[]} nodes
 */ 
class FwNodes {
    /**
     * @constructor
     */
    constructor(nodes) {
        this.nodes = nodes;
    }
    /**
     * Return 
     * @method index
     * @param {number} index - node index in the nodes array
     * @return {FwNode|null}
     */
    index(index) {
        var node = this.nodes[index];

        if (node) return new FwNode(node);

        return null;    
    }
    /**
     * Return the first node
     * @method first
     * @return {FwNode|null}
     */
    first() {
        return this.nodes[0] ? new FwNode(this.nodes[0]) : null;
    }   
    /**
     * Return the last node
     * @method last
     * @return {FwNode|null}
     */
    last() {
        var lastIndex = this.nodes.length - 1;

        return lastIndex !== -1 ? new FwNode(this.nodes[lastIndex]) : null;
    } 
    /**
     * Iterate over all nodes
     * @method iterate
     * @param {function} cb - Callback function
     */
    iterate(cb) {
        var n, l;

        for (n = 0, l = this.nodes.length; n < l; n++) {
            cb(new FwNode(this.nodes[n]));
        }
    }
    /**
     * Return first element
     * @method firstEl
     * @return {fw/ui/Element}
     */
    firstEl() {
        var n, l, node;

        for (n = 0, l = this.nodes.length; n < l; n++) {
            node = this.nodes[n];

            if (node.fwElement) {
                return node.fwElement;
            }
        }

        return null;
    }
    /** 
     * Return last element
     * @method lastEl
     * @return {fw/ui/Element}
     */
    lastEl() {
        var n, node;

        for (n = this.nodes.length - 1; n >= 0; n--) {
            node = this.nodes[n];

            if (node.fwElement) {
                return node.fwElement;
            }
        }

        return null;
    }
    /**
     * Iterate over all elements
     * @method iterate
     * @param {function} cb - Callback function
     */
    iterateEl(cb) {
        var n, l, node;

        for (n = 0, l = this.nodes.length; n < l; n++) {
            node = this.nodes[n];
            if (node.fwElement) {
                cb(node.fwElement);
            }
        }
    }  
}

module.exports = FwNode;
