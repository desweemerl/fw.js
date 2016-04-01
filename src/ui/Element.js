/**
 * @module fw/ui/Element
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */
'use strict';

var dom = require('../dom');
var ElementError = require('../error/ElementError');
var EventEmitter = require('../EventEmitter');
var Translator = require('../i18n/Translator');
var types = require('../types');
var utils = require('../utils');

// Create a global event emitter that allows messaging between elements
var eventEmitter = new EventEmitter();

// Check event and listener types (string and function respectively)
function checkEventListener(instance, event, listener, method) {
    if (types.isEmptyString(event)) {
        throw new ElementError({
            elementName: instance.constructor.name,
            message:     'event "' + event  + '" was not correctly defined',
            origin:      '"' + method + '" method'
        });
    }

    if (!types.isFunction(listener)) {
        throw new ElementError({
            elementName: instance.constructor.name,
            message:     'listener is not a function for event "' + event + '"',
            origin:      '"' + method + '" method'
        });
    }
}

/**
 * Create an UI element
 * @class
 * @alias module:fw/ui/Element
 * @param {Object} config - the configuration object parameter
 * @param {Object} [config.i18n] - the dictionary which contains the translations
 * @param {boolean} [config.visible] - set the visibility of the UI Element
 * @param {Node} node - the base node of the UI Element
 */
class FwElement {
    /**
     * @constructor
     */
    constructor(config) {
        var tagName = this.constructor.tagName;
        var classNames;
        var n, l;

        // Check the existence of tagName
        if (types.isEmptyString(tagName)) {
            throw new ElementError({
                origin:  'instantiation of element',
                message: 'tagName is not defined'
            });
        }

        this.config = config || {};
        // Set parameters
        this.isAttached = false;
        this.isBuilt = false;
        this.isBound = false;
        this.isVisible = true;
        // Create event handlers stores
        this.nodeHandlers = {};
        this.windowHandlers = {};
        this.eventEmitterHandlers = {};
        this.attributeHandlers = {};

        // Add internationalization support;
        Translator.call(this, config);
        this.i18n = this.config.i18n || null;
        // Initialize the element
        this.initialize();
        // Process the existing node
        if (this.config.node) {
            if (this.config.node instanceof Node) {
                if (this.config.node.tagName !== tagName.toUpperCase()) {
                    throw new ElementError({
                        origin:  'scanning class node',
                        message: 'config.node has wrong tagName'
                    });
                }

                if (this.config.node.fwElement) {
                    throw new ElementError({
                        origin:  'scanning class node',
                        message: 'config.node is already linked to an FwElement instance'
                    });
                }

                this.node = this.config.node;
                this.processNode(this.node);
                dom.emptyNode(this.node);
            } else {
                throw new ElementError({
                    origin:  'scanning class node',
                    message: 'config.node is not an instance of Node'
                });
            }
        } else {
            // Build the element and bind events to the created node
            this.node = document.createElement(tagName);
        }
        // Add class in config
        classNames = types.isArray(config.classNames) ? config.classNames : [];
        // Add it className if defined
        if (!types.isEmptyString(config.className) && classNames.indexOf(config.className) === -1) {
            classNames.push(this.config.className);
        }

        if (l = classNames.length) { 
            for (n = 0; n < l; n++) {
                this.node.classList.add(classNames[n]);
            }
        }

        this.node.fwElement = this;
        this.buildUI();
        this.isBuilt = true;
        // Check if this.node has been created
        if (!(this.node instanceof Node)) {
            throw new ElementError({
                origin:  'element initialization',
                message: 'this.node has not been created after buildUI'
            });
        } 
        this.bindUI();
        this.isBound = true;
        // Hide element if wanted
        if (this.config.visible === false) {
            this.hide();
        }
    }
    /**
     * Get element's name
     * @method getName
     * @return {string|null}
     */ 
    getName() {
        return this.node.getAttribute('name');
    }
    /**
     * Get element's id
     * @method getId
     * @return {string}
     */
    getId() {
        return this.node.id;
    }
    /**
     * Process this.config.node
     * @abstract
     * @method processNode
     * @param {Node} node
     */
    processNode(node) {}
    /**
     * Called when the UI Element is instantiated
     * @abstract
     * @method initialize
     * @param {Object} config - the configuration object parameter
     */
    initialize() {}
    /**
     * Called when the UI Element is built
     * @abstract
     * @method buildUI
     */
    buildUI() {}
    /**
     * Called when the UI Element events are bound
     * @abstract
     * @method bindUI
     */
    bindUI() {}
    /**
     * Add a class to the UI Element
     * @method addClass
     * @param {string} className
     */
    addClass(className) {
        if (!types.isEmptyString(className)) {
            this.node.classList.add(className);
        }
    }
    /**
     * Remove a class from the UI Element
     * @method removeClass
     * @param {string} className
     */
    removeClass(className) {
        if (!types.isEmptyString(className)) {
            this.node.classList.remove(className);
        }
    }
    /**
     * Trigger an attach event. The window and document attach events are also called.
     * @method triggerAttach
     */
    triggerAttach() {
        var self = this;

        this.isAttached = true;
        this.attachEvents();

        if (types.isFunction(this.onAttach)) {
            window.setTimeout(function() {
                self.onAttach();
            }, 0);
        }
    }
    /**
     * Trigger a detach event. The window and document detach events are also called.
     * @method triggerDetach
     */
    triggerDetach() {
        var self = this;

        this.isAttached = false;
        this.detachEvents();

        if (types.isFunction(this.onDetach)) {
            window.setTimeout(function() {
                self.onDetach();
            }, 0);
        }
    }
    /**
     * Detach all window registered events
     * @method detachWindowEvents
     */
    detachEvents() {
        var event, handler;

        for (event in this.windowHandlers) {
            handler = this.windowHandlers[event];

            if (handler.bound) {
                handler.bound = false;
                window.removeEventListener(event, handler.listener, handler.useCapture);
            }
        }

        for (event in this.eventEmitterHandlers) {
            handler = this.eventEmitterHandlers[event];

            if (handler.bound) {
                handler.bound = false;
                eventEmitter.off(event, handler.listener);
            }
        }
    }
    /**
     * Attach window rigestered events
     * @method attachWindowEvents
     */
    attachEvents() {
        var event, handler;

        for (event in this.windowHandlers) {
            handler = this.windowHandlers[event];

            if (!handler.bound) {
                handler.bound = true;
                window.addEventListener(event, handler.listener, handler.useCapture);
            }
        }

        for (event in this.eventEmitterHandlers) {
            handler = this.eventEmitterHandlers[event];

            if (!handler.bound) {
                handler.bound = true;
                eventEmitter.on(event, handler.listener);
            }
        }       
    }
    /**
     * Destroy UI Element
     * @method destroy
     * @abstract
     */
    destroy() {}
    /**
     * Add a listener for an attribute change
     * @method onAttributeChange
     * @param {string} attribute - attribute processed
     * @param {function} listener - listener attached 
     */
    onAttributeChange(attribute, listener) {
        var value;

        if (types.isEmptyString(attribute)) {
            throw new ElementError({
                elementName: this.constructor.name,
                message:     'attribute was not correctly defined',
                origin:      '"onAttributeChange" method'
            });
        }

        if (!types.isFunction(listener)) {
            throw new ElementError({
                elementName: this.constructor.name,
                message:    'listener is not a function',
                origin:     '"onAttributeChange" method'
            });
        }

        if (!this.attributeHandlers[attribute]) {
            this.attributeHandlers[attribute] = listener;
            value = this.node.getAttribute(attribute);

            if (value) {
                listener.call(this, value);    
            }
        }
    }
    /**
     * Remove a listener for an attribute change
     * @method offAttributeChange
     * @param {string} attribute - attribute processed
     */
    offAttributeChange(attribute) {
        if (types.isEmptyString(attribute)) {
            throw new ElementError({
                elementName: this.constructor.name,
                message:    'attribute was not correctly defined',
                origin:     '"offAttributeChange" method'
            });
        }

        if (this.attributeHandlers[attribute]) {
            delete this.attributeHandlers[attribute];
        }
    }   
    /**
     * Set attribute value
     * @method setAttribute
     * @param {string} attibute - attribute processed
     * @param {*} value - new attribute value
     */
    setAttribute(attribute, value) {
        var strValue = value.toString();

        if (types.isEmptyString(attribute)) {
            throw new ElementError({
                elementName: this.constructor.name,
                message:    'attribute was not correctly defined',
                origin:     '"setAttribute" method'
            });
        }

        this.node.setAttribute(attribute, strValue);
        if (this.attributeHandlers[attribute]) {
            this.attributeHandlers[attribute].call(this, strValue);
        }
    }
    /**
     * Get Attribute value
     * @method getAttribute
     * @param {string} attribute
     * @return {string}
     */
    getAttribute(attribute) {
        return this.node.getAttribute(attribute);
    } 
    /**
     * Remove attribute
     * @method removeAttribute
     * @param {string} attibute - attribute processed
     */
    removeAttribute(attribute) {
        if (types.isEmptyString(attribute)) {
            throw new ElementError({
                elementName: this.constructor.name,
                message:    'attribute was not correctly defined',
                origin:     '"removeAttribute" method'
            });
        }     

        this.node.removeAttribute(attribute);
        if (this.attributeHandlers[attribute]) {
            this.attributeHandlers[attribute].call(this, null);
        }       
    }   
    /**
     * Add event(s) to the event emitter
     * @method on
     * @param {string, string[]} event - event(s) to be registered
     * @param {function} listener - listener attached to the event
     */   
    onEvent(event, listener) {
        var self = this;
        var events = types.isArray(event) ? event : [event];
        var handler;
        var e, n, l;

        function callback(listenerEvent) {
            listener.call(self, listenerEvent);
        }

        for (n = 0, l = events.length; n < l; n++) { 
            e = events[n];
            checkEventListener(this, e, listener, 'onEvent');

            if (!this.eventEmitterHandlers[e]) {
                handler = this.eventEmitterHandlers[e] = {
                    bound:    this.isAttached,
                    listener: callback
                };

                if (this.isAttached) {
                    eventEmitter.on(e, callback, true);
                }
            }
        }
    }
    /**
     * Remove event(s) from the event emitter
     * @method off
     * @param {string} event - event(s) to be removed 
     */
    offEvent(event) {
        var events = types.isArray(event) ? event : [event];
        var handler;
        var e, n, l;

        for (n = 0, l = events.length; n < l; n++) {
            e = events[n];
            handler = this.eventEmitterHandlers[e];

            if (handler) {
                delete(this.eventEmitterHandlers[e]);

                if (handler.bound) {
                    eventEmitter.off(e, handler.listener); 
                }
            }
        }
    }
    /**
     * Emit an event
     * @method emitEvent
     * @param {string} event - event name
     * @param {*} [data] - data associated with the event 
     */
    emitEvent(event, data) {
        eventEmitter.emit(event, data);
    }
    /**
     * Register window event(s)
     * @method onWindowEvent
     * @param {string} event - event(s) ("click", "focus", "change", ...)
     * @param {function} listener - function(event) listener 
     * @param {boolean} [useCapture=true] - set the listener on capturing phase
     */
    onWindowEvent(event, listener, useCapture) {
        var self = this;
        var events = types.isArray(event) ? event : [event];
        var handler;
        var e, n, l;

        function callback(listenerEvent) {
            listener.call(self, listenerEvent);
        }

        for (n = 0, l = events.length; n < l; n++) { 
            e = events[n];
            checkEventListener(this, e, listener, 'onWindowEvent');

            if (!this.windowHandlers[e]) {
                handler = this.windowHandlers[e] = {
                    bound:      this.isAttached,
                    listener:   callback,
                    useCapture: useCapture === undefined ? true : !!useCapture
                };

                if (this.isAttached) {
                    window.addEventListener(e, handler.listener, handler.useCapture);
                }
            }
        }
    }
    /**
     * Unregister window event(s)
     * @method offWindowEvent
     * @param {string|string[]} event - event(s) ("click", "focus", "change", ...)
     */
    offWindowEvent(event) {
        var events = types.isArray(event) ? event : [event];
        var handler;
        var e, n, l;

        for (n = 0, l = events.length; n < l; n++) {
            e = events[n];
            handler = this.windowHandlers[e];

            if (handler) {
                delete this.windowHandlers[e];

                if (handler.bound) {
                    window.removeEventListener(e, handler.listener, handler.useCapture);
                }
            }
        }
    } 
    /**
     * Register UI Element event(s)
     * @method on
     * @param {string} event - event(s) ("click", "focus", "change", ...)
     * @param {function} listener - function(event) listener
     * @param {boolean} [useCapture=true] - set the listener on capturing phase
     */
    on(event, listener, useCapture) {
        var self = this;
        var events = types.isArray(event) ? event : [event];
        var handler;
        var e, n, l;

        function callback(listenerEvent) {
            listener.call(self, listenerEvent);
        }

        for (n = 0, l = events.length; n < l; n++) {
            e = events[n];
            checkEventListener(this, e, listener, 'on');

            if (!this.nodeHandlers[e]) {

                handler = this.nodeHandlers[e] = {
                    listener:   callback,
                    useCapture: useCapture === undefined ? true : !!useCapture
                };

                this.node.addEventListener(e, handler.listener, handler.useCapture);
            }
        }
    }
    /**
     * Unregister a UI Element event(s)
     * @method off
     * @param {string} event - event(s) ("click", "focus", "change", ...)
     */
    off(event) {
        var events = types.isArray(event) ? event : [event];
        var handler;
        var e, n, l;

        for (n = 0, l = events.length; n < l; n++) {
            e = events[n];
            handler = this.nodeHandlers[e];

            if (handler) {
                delete this.nodeHandlers[e];
                this.node.removeEventListener(e, handler.listener, handler.useCapture);
            }
        }
    }
    /**
     * Show the UI Element
     * @method show
     */
    show() {
        this.node.style.display = this.computedDisplayStyle;
        this.isVisible = true;
    }
    /**
     * Hide the UI Element
     * @method hide
     */
    hide() {
        this.computedDisplayStyle = window.getComputedStyle(this.node).display;

        if (this.node.style.display !== 'none') {
            this.node.style.display = 'none';
        }

        this.isVisible = false;
    }
    /**
     * Get the UI Element z-index
     * @method getzIndex
     * @return {number}
     */
    getzIndex() {
        return dom.getZIndex(this.node);
    }
    /**
     * Detach the Element from the DOM
     * @method detach
     * @return {boolean} detached
     */
    detach() {
        if (this.node.parentNode) {
            this.node.parentNode.removeChild(this.node);
            return true;
        }
        return false;
    }
    /**
     * Replace the Element with an other one
     * @method replaceWith
     * @param {fw/ui/Element} element
     * @return {boolean} replaced
     */
    replaceWith(element) {
        if (this.node.parentNode && element instanceof FwElement && element !== this) {
            this.node.parentNode.replaceWith(this.node, element.node);
            return true;
        }
        return false;
    }
    /**
     * Check if a node has a CSS class name
     * @method hasClass
     * @param {string} className
     * @return {boolean}
     */
    hasClass(className) {
        if (!types.isEmptyString(className)) {
            return this.node.classList.contains(className);
        }

        return false;
    }
}

// Add Translator support
utils.extendObject(FwElement.prototype, Translator.prototype);

module.exports = FwElement;
