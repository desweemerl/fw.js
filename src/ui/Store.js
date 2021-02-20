/**
 * @module fw/ui/Store
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var FwElement = require('./Element');
var ModuleError = require('../error/ModuleError');
var utils = require('../utils');
var types = require('../types');

/**
 * Create an elements store
 * This class is used when instantiation of multiple elements at the same time (innerHTML method)
 */
class Store {
    /**
     * @constructor
     */
    constructor(elements) {
        this.elements = [];
        this.namedElements = {};

        if (elements) {
            this.add(elements);
        }
    }
    /**
     * Return all elements
     * @method all 
     * @return {Array.<fw/ui/Element>}
     */
    all() {
        return this.elements;
    }
    /**
     * Return element with a specified name
     * @method
     * @param {string} name - element's name
     * @return {fw/ui/Element}
     */
    el(name) {
        return this.namedElements[name];
    }
    /**
     * Merge element stores
     * @method merge
     */
    merge(store) {
        var n, l, key, element;

        if (!(store instanceof Store)) {
            throw new ModuleError({
                moduleName: 'Store',
                message:    'argument "store" must be an instance of Store',
                origin:     'merge function'
            });       
        }

        if (store === this) return;
    
        for (n = 0, l = store.elements.length; n < l; n++) {
            element = store.elements[n];

            if (this.elements.indexOf(element) === -1) {
                this.elements.push(element);
            }
        }

        for (key in store.namedElements) {
            this.namedElements[key] = store.namedElements[key];
        }
    }
    /**
     * Add an element to the element store
     * @method add
     * @param {string} [name] - element name
     * @param {fw/ui/Element} element
     */
    add() {
        var element, name, n, l;

        if (arguments.length === 1) {
            element = arguments[0];
        } else if (arguments.length > 1) {
            name = arguments[0];
            element = arguments[1];
        }

        if (element instanceof FwElement) {
            if (this.elements.indexOf(element) === -1) {
                this.elements.push(element);
                if (!types.isEmptyString(name)) {
                    this.namedElements[name] = element; 
                }
            }
        } else {
            throw new ModuleError({
                moduleName: 'Store',
                message:    'argument "elements" must be an element',
                origin:     '"add" method'
            });
        }
    }
    /**
     * Remove element from the element store
     * @method remove
     * @param {string|fw/ui/Element} arg - element
     */
    remove(arg) {
        var element, key, index;

        if (!fw.isEmptyString(arg)) {
            element = this.namedElements[arg];
            
            if (element) {
                delete this.namedElements[arg]; 
            }
            
            this.elements.splice(this.elements.indexOf(element), 1);
        } else if (arg instanceof FwElement) {
            index = this.elements.indexOf(element);
            
            if (index !== -1) {
                this.elements.splice(index, 1); 
            }

            for (key in this.namedElements) {
                if (this.namedElements[key] === arg) {
                    delete this.namedElements[key];
                    break;
                }
            }
        } else {
            throw new ModuleError({
                moduleName: 'Store',
                message:    'argument "arg" must be either a string or an element',
                origin:     '"remove" method'
            });
        }
    }
    /**
     * Callback called for each iteration
     * @callback Store~iterate
     * @param {fw/ui/Element} element
     */
    /**
     * Iterate over elements
     * @method iterate
     * @param {Array.<string>} [names] - named elements
     * @param {Store~iterate} callback
     */
    iterate() {
        var names, callback;
        var name, n, l;

        if (arguments.length === 1) {
            callback = arguments[0];
        } else if (arguments.length > 1) {
            names = arguments[0];
            callback = arguments[1];
        }

        if (!types.isFunction(callback)) return;

        if (names instanceof Array) {
            for (n = 0, l = names.length; n < l; n++) {
                name = names[n];

                if (this.namedElements[name]) {
                    callback(this.namedElements[name]);
                } 
            } 
        } else {
            for (n = 0, l = this.elements.length; n < l; n++) {
                callback(this.elements[n]);
            }
        }
    }
}

module.exports = Store;
