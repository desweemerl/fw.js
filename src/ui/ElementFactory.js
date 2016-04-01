/**
 * @module fw/ui/ElementFactory
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */
'use strict';

var dom = require('../dom');
var FwElement = require('./Element');
var ModuleError = require('../error/ModuleError');
var Source = require('../source/Source');
var Store = require('./Store');
var types = require('../types');
var utils = require('../utils');

var instantiationActivated = false;
var registeredElements = {};
var ElementFactory;

/**
 * Create a custom element factory
 */
var AbstractElementFactory = {
    /**
     * Return a registered element
     * @function getRegisteredElement
     * @param {string} tagName - registered element name
     * @return {fw/ui/Element}
     */
    getRegisteredElement: function(tagName) {
        return registeredElements[tagName.toLowerCase()] || null;
    },
    /**
     * Register an element
     * @function registerElement
     * @param {string} name - element name
     * @param {fw/ui/Element} element - element to be registered
     */
    registerElement: function(element) {},
    /**
     * Get all tag names of registered elements
     * @function getAllTagNames
     * @return {Array.<string>}
     */
    getRegisteredElements: function() {
        return Object.keys(registeredElements);
    },
    /**
     * Check if an element is registered
     * @function isElementRegistered
     * @param {string} tagName
     * @return {boolean}
     */
    isElementRegistered: function(tagName) {
        return registeredElements[tagName.toLowerCase()] !== undefined;
    },
    /**
     * Create an element instance from its tag name if registered
     * @function createElement
     * @param {string} tagName - registered element's tag name
     * @param {Object} config - configuration of the element instance
     * @return {fw/ui/Element}
     */
    createElement: function(tagName, config) {
        var RegisteredElement = registeredElements[tagName];
        var instance;

        if (RegisteredElement === undefined) {
            throw new ModuleError({
                moduleName: 'ElementFactory',
                message:    '"' + tagName + '" is not registered',
                origin:     'createElement function'});
        }

        instantiationActivated = true;
        instance = new RegisteredElement(config);
        instantiationActivated = false;
        return instance;
    },
    /**
     * Append HTML to node or element and create elements if necessary
     * @function html
     * @param {Node|fw/ui/Element} element - node or element that will be expanded
     * @param {string} HTML - HTML string
     * @param {object} config - configuration
     */
    html: function() {},
};

function checkElement(element) {
    var elementName, registeredElement;

    if (!(element.prototype instanceof FwElement)) {
        throw new ModuleError({
            moduleName: 'ElementFactory',
            message:    'element is not an instance of Element',
            origin:     'checkElement function' });
    }

    if (!types.isEmptyString(element.tagName)) {
        elementName = element.tagName.toLowerCase();
        registeredElement = registeredElements[elementName];

        if (registeredElement !== undefined) {
            if (registeredElement !== element) {
                throw new ModuleError({
                    moduleName: 'ElementFactory',
                    message:    'an element with the same tag is already registered',
                    origin:     'checkElement function' });
            }

            return false;
        }
    }

    return true;
}

function getElementFactoryMO() {
    var mutationObserver = new MutationObserver(function(mutations) {
        var ElementClass, element;
        var mutation, n, l;
        var nodes, i, j;
        var node, p, q;

        for (n = 0, l = mutations.length; n < l; n++) {
            mutation = mutations[n];

            for (i = 0, j = mutation.addedNodes.length; i < j; i++) {
                node = mutation.addedNodes[i];
                if (node.nodeType !== 1) continue;
                nodes = Array.prototype.slice.call(node.getElementsByTagName('*'));
                nodes.unshift(node);

                for (p = 0, q = nodes.length; p < q; p++) {
                    node = nodes[p];

                    if (node.fwElement && !node.fwElement.isAttached) {
                        node.fwElement.triggerAttach();
                    }
                }
            }

            for (i = 0, j = mutation.removedNodes.length; i < j; i++) {
                node = mutation.removedNodes[i];
                if (node.nodeType !== 1) continue;
                nodes = Array.prototype.slice.call(node.getElementsByTagName('*'));
                nodes.unshift(node);

                for (p = 0, q = nodes.length; p < q; p++) {
                    node = nodes[p];

                    if (node.fwElement && node.fwElement.isAttached) {
                        node.fwElement.triggerDetach();
                    }
                }
            }
        }
    });

    dom.documentReady().then(function() {
        mutationObserver.observe(document.body, { childList: true, subtree: true });
    });

    return utils.extendObject(AbstractElementFactory, {
        /**
         * Register an element
         * @function registerElement
         * @param {string} name - element name
         * @param {fw/ui/Element} element - element to be registered
         */
        registerElement: function(element) {
            if (checkElement(element)) {
                registeredElements[element.tagName.toLowerCase()] = element;
            }
        },
        /**
         * Append HTML to node or element and create elements if necessary
         * @function html 
         * @param {Node|fw/ui/Element} element - node or element that will be expanded
         * @param {string} HTML - HTML string
         * @param {object} config - configuration
         */
        html: function() {
            var sharedSources = [];
            var element, elements, HTML;
            var config, sharedConfig;
            var name, value;
            var parentNode, nodes, node, store, ElementClass, elConfig, elInstance;
            var n, l;

            if (arguments.length >= 2) {
                element = arguments[0];
                HTML = arguments[1];
            } else {
                throw new ModuleError({
                    moduleName: 'ElementFactory',
                    message:    'missing arguments (Element, HTML)',
                    origin:     'html function'});
            }

            if (arguments.length === 3) {
                config = arguments[2] || {};
                sharedConfig = null;
            } else if (arguments.length > 3) {
                sharedConfig = arguments[2] || {};
                config = arguments[3] || {};
            }

            if (element instanceof Node && element.nodeType === 1) {
                parentNode = element;
            } else if (element instanceof FwElement) {
                parentNode = element.node;
            } else {
                throw new ModuleError({
                    moduleName: 'ElementFactory',
                    message:    'element is not an instance of Node or Element',
                    origin:     'html function'});
            }

            if (types.isEmptyString(HTML)) {
                throw new ModuleError({
                    moduleName: 'ElementFactory',
                    message:    'HTML is not a valid string',
                    origin:     'html function'});
            }

            if (!types.isObject(config)) {
                throw new ModuleError({
                    moduleName: 'ElementFactory',
                    message:    'config is not an object',
                    origin:     'html function'});
            }

            if (sharedConfig !== null && !types.isObject(sharedConfig)) {
                throw new ModuleError({
                    moduleName: 'ElementFactory',
                    message:    'sharedConfig is not an object',
                    origin:     'html function'});
            }

            if (sharedConfig !== null) {
                for (name in sharedConfig) {
                    value = sharedConfig[name];

                    if (value instanceof Source && sharedSources.indexOf(value) === -1) {
                        sharedSources.push(value),
                        delete sharedConfig[name];    
                    } 
                }
            
            }

            store = new Store();
            parentNode.innerHTML = HTML;
            nodes = Array.prototype.slice.call(parentNode.getElementsByTagName('*'));

            for (n = 0, l = nodes.length; n < l; n++) {
                node = nodes[n];
                if (node.nodeType === 1 && node.tagName.indexOf('-') !== -1 && (ElementClass = registeredElements[node.tagName.toLowerCase()])) {
                    elConfig = !types.isEmptyString(name = node.getAttribute('name')) ? 
                        utils.extendObject(config[name], sharedConfig, { node: node }) : 
                        utils.extendObject(sharedConfig, { node: node });    
                    store.add(name, new ElementClass(elConfig));
                }
            }

            elements = store.all();

            for (n = 0, l = sharedSources.length; n < l; n++) {
                sharedSources[n].bind(elements);
            }

            return store;
        }
    });
}

function getElementFactoryCE() {
    var storeActivated = false;
    var config, sharedConfig, store;

    return utils.extendObject(AbstractElementFactory, {
        /**
         * Register an element
         * @function registerElement
         * @param {string} name - element name
         * @param {fw/ui/Element} element - element to be registered
         */
        registerElement: function(element) {
            var self = this;
            var ElementProto;

            if (!checkElement(element)) return;
            registeredElements[element.tagName.toLowerCase()] = element;

            ElementProto = Object.create(HTMLElement.prototype);
            ElementProto.createdCallback = function() {
                var ElementClass;
                var elConfig, elInstance;
                var name, value;

                if (!instantiationActivated) return;

                config = config || {};
                ElementClass = registeredElements[this.tagName.toLowerCase()];

                elConfig = !types.isEmptyString(name = this.getAttribute('name')) ? 
                    utils.extendObject(config[name], sharedConfig, {node: this}) : 
                    utils.extendObject(sharedConfig, {node: this });

                try {
                    elInstance = new ElementClass(elConfig);
                } catch(ex) {
                    console.log(ex);
                    console.log(ex.stack);
                }

                if (storeActivated) {
                    store.add(name, elInstance);
                }
            };
            ElementProto.attachedCallback = function() {
                if (this.fwElement) this.fwElement.triggerAttach();
            };
            ElementProto.detachedCallback = function() {
                if (this.fwElement) this.fwElement.triggerDetach();
            };

            document.registerElement(element.tagName.toLowerCase(), { prototype: ElementProto });
        },
        /**
         * Append HTML to node or element and create elements if necessary
         * @function html
         * @param {Node|fw/ui/Element} element - node or element that will be expanded
         * @param {string} HTML - HTML string
         * @param {object} config - configuration
         */
        html: function() {
            var sharedSources = [];
            var element, elements, parentNode, HTML;
            var elsConfig, elsSharedConfig;
            var name, value;
            var outputStore;
            var n, l;

            storeActivated = true;

            if (arguments.length >= 2) {
                element = arguments[0];
                HTML = arguments[1];
            } else {
                throw new ModuleError({
                    moduleName: 'ElementFactory',
                    message:    'missing arguments (Element, HTML)',
                    origin:     'html function'});
            }

            if (arguments.length === 3) {
                elsConfig = arguments[2] || {};
                elsSharedConfig = null;
            } else if (arguments.length > 3) {
                elsSharedConfig = arguments[2] || {};
                elsConfig = arguments[3] || {};
            }

            if (element instanceof Node && element.nodeType === 1) {
                parentNode = element;
            } else if (element instanceof FwElement) {
                parentNode = element.node;
            } else {
                throw new ModuleError({
                    moduleName: 'ElementFactory',
                    message:    'element is not an instance of Node or Element',
                    origin:     'html function'});
            }

            if (types.isEmptyString(HTML)) {
                throw new ModuleError({
                    moduleName: 'ElementFactory',
                    message:    'HTML is not a valid string',
                    origin:     'html function'});
            }

            if (!types.isObject(elsConfig)) {
                throw new ModuleError({
                    moduleName: 'ElementFactory',
                    message:    'config is not an object',
                    origin:     'html function'});
            }

            if (elsSharedConfig !== null && !types.isObject(elsSharedConfig)) {
                throw new ModuleError({
                    moduleName: 'ElementFactory',
                    message:    'sharedConfig is not an object',
                    origin:     'html function'});
            }

            if (elsSharedConfig !== null) {
                for (name in elsSharedConfig) {
                    value = elsSharedConfig[name];
                
                    if (value instanceof Source && sharedSources.indexOf(value) === -1) {
                        sharedSources.push(value);
                        delete elsSharedConfig[name];
                    }   
                }
            }

            config = elsConfig;
            sharedConfig = elsSharedConfig;
            store = new Store();
            instantiationActivated = true;
            parentNode.innerHTML = HTML;
            instantiationActivated = false;
            config = null;
            sharedConfig = null;
            outputStore = store;
            store = null;
            storeActivated = false;

            elements = outputStore.all();

            for (n = 0, l = sharedSources.length; n < l; n++) {
                sharedSources[n].bind(elements);
            }

            return outputStore;
        }
    });

}

if (document.registerElement) {
    ElementFactory = getElementFactoryCE();
} else if (MutationObserver) {
    ElementFactory = getElementFactoryMO();
} else {
    throw new ModuleError({
        moduleName: 'ElementFactory',
        message:    'MutationObserver or document.registerElement not supported',
        origin:     'ElementFactory creation'});
}

module.exports = ElementFactory;
