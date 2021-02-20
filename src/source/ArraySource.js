/**
 * @module fw/source/ArraySource
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var ArrayElement = require('../ui/ArrayElement');
var ArrayModel = require('../ArrayModel');
var ObjectModel = require('../ObjectModel');
var Source = require('../source/Source');
var SourceError = require('../error/SourceError');
var types = require('../types');
var utils = require('../utils');
var ValidatorFactory = require('../validator/ValidatorFactory');

/**
 * Create an instance of fw/source/ArraySource     
 * @class
 * @alias module:fw/source/ArraySource
 * @augments fw/source/Source
 * @param {Object} config - the configuration object of the ArraySource
 * @param {string} config.url - the URL of ajax request
 * @param {fw/ArrayModel} [config.model] - defined model based on fw/ArrayModel
 * @param {Array} [config.array] - array injected to the ArraySource model
 * @param {function} [config.onChangeSource] - called when the source is updated
 * @param {function} [config.onChange] - called when a property in a row is updated
 * @param {function} [config.onAdd] - called when a property in a row is added
 * @param {function} [config.onDelete] - called when a property in a row is deleted
 * @param {function} [config.onUpdate] - called when a property in a row is updated
 * @param {fw/ui/Element|fw/ui/Element[]} [config.elements] - element(s) bound to the ArraySource
 */
class ArraySource extends Source {
    /**
     * @constructor
     */
    constructor(config) {
        super(config);
       
        var self = this;

        this.elements = [];
        this.onChangeSource = this.config.onChangeSource || null;
        this.onChange = this.config.onChange || null;
        this.onAdd = this.config.onAdd || null;
        this.onDelete = this.config.onDelete || null;
        this.onUpdate = this.config.onUpdate || null;
        // Check if the model is defined
        if (ObjectModel.isClass(this.config.model)) {
            this.model = ArrayModel({ model: this.config.model, observer: this.config.observer }); // jshint ignore:line
        }
        // If the model is an object, create a fw/ObjectModel class with model as configuration
        else if (types.isObject(this.config.model)) {
            this.model = ArrayModel({ model: config.model, observer: this.config.observer }); // jshint ignore:line
            // Create an empty fw/ObjectModel class if model is not defined
        } else {
            this.model = ArrayModel({ observer: this.config.observer }); // jshint ignore:line
        }
        // Add an observer to fw/ArrayModel class that will observer updates and synchronize the ArraySource
        this.model.getModel().addObserver('after', function(prop, value, flag) {
            var index, n, l;

            if (flag === 'update') {
                index = self.source.indexOf(this);
                // Refresh all registered elements
                for (n = 0, l = self.elements.length; n < l; n++) {
                    self.elements[n].synchronize('update', index);
                }
                // call onChange if exists
                if (types.isFunction(self.onChange)) {
                    self.onChange(self.source);
                }               
            }
        });
        // Check if a defaultItem is defined
        if (ObjectModel.isInstance(this.config.defaultItem)) {
            this.defaultItem = this.config.defaultItem.getObject();
        } else if (types.isObject(this.config.defaultItem)) {
            this.defaultItem = this.config.defaultItem;
        }
        // Create the source
        if (this.config.array instanceof Array) {
            this.source = new this.model(this.config.array);
        }
        // If array is an instance of fw/ArrayModel, get the array stored
        else if (ArrayModel.isInstance(this.config.array)) {
            this.source = new this.model(this.config.array.getArray());
        }
        // Define an empty ArraySource if it's not defined
        else {
            this.source = new this.model();
        }
    }
    /**
     * Bind element(s) to the ArraySource
     * @method bind
     * @param {fw/ui/Element|fw/ui/Element[]} [elements] - element(s) bound to the ArraySource
     */
    bind(elements) {
        var self = this;
        var configModified = false;
        var arrayModel = this.model.getModel();
        var config = {};
        var elementsToSync = [];
        var n, l, element;
        // Adapt model to element propertie 
        function addProperty(element, name, parameters) {
            var propConf = {};
            var definedType = arrayModel.getType(name);
            var validators;
            // If type is defined for the element, check if it matches the property type in the model
            if (!types.isEmptyString(parameters.type) || types.isFunction(parameters.type)) {
                // If property type defined in the model is "any" or "undefined", then it must be adapted
                if (definedType === undefined || definedType === '*') {
                    propConf.type = parameters.type;
                }
                // If column type doesn't match the model type, throws an error
                else if (parameters.type !== '*' && definedType !== parameters.type) {
                    throw new SourceError({
                        sourceName: 'ArraySource',
                        origin:     'element binding',
                        message:    'property "' + name + '"has already a type',
                        element:    element
                    });
                }
            } else if (definedType === undefined) {
                propConf.type = '*';
            }
            // Set a defaultValue if exists
            if (parameters.defaultValue !== undefined) {
                propConf.defaultValue = parameters.defaultValue;
            }

            if (!types.isEmptyObject(parameters.validators)) {
                utils.extendObject(propConf, validators);
            }
            // Check if changes must be done on the model
            if (!types.isEmptyObject(propConf)) {
                utils.setValueToObject(config, 'fields.' + name, propConf);
                configModified = true;
            }
        }
        // Process element
        function processElement(element) {
            var name;

            if (element instanceof ArrayElement) {
                if ((element.arraySource !== self) && (element.arraySource instanceof ArraySource)) { 
                    element.arraySource.unbind(element); 
                }

                if (self.elements.indexOf(element) !== -1) { 
                    self.unbind(element); 
                }

                for (name in element.properties) {
                    addProperty(element, name, element.properties[name]);
                }

                self.elements.push(element);
                element.arraySource = self;
                elementsToSync.push(element);
            }
        }
        // Check if we bind an array of element
        if (elements instanceof Array) {
            for (n = 0, l = elements.length; n < l; n++) {
                processElement(elements[n]);
            }
        } else {
            processElement(arguments[0]);
        }
        // Extend the model if changes must be applied
        if (configModified) {
            this.model = ArrayModel({ // jshint ignore:line
                model:    arrayModel.extend(config),
                observer: this.config.observer
            }); 
            this.source = new this.model(this.source.getArray());
        }
        // Synchronize bound elements
        for (n = 0, l = elementsToSync.length; n < l; n++) {
            elementsToSync[n].synchronize('init');
        }
    }
    /**
     * Unbind element(s) from the ArraySource
     * @method unbind
     * @param {fw/ui/Element|fw/ui/Element[]} [elements] - element(s) bound to the ArraySource
     */
    unbind() {
        var self = this;
        var elements = arguments[0];
        var n, l;
        // Process element
        function processElement(element) {
            if (!(element instanceof ArrayElement)) return;

            var index = self.elements.indexOf(element);

            if (index !== -1) {
                self.elements.splice(index, 1);
                element.arraySource = null;
            }
        }
        // Check if we unbind an array of element
        if (elements instanceof Array) {
            for (n = 0, l = elements.length; n < l; n++) {
                processElement(elements[n]);
            }
        } else {
            processElement(arguments[0]);
        }
    }
    /**
     * Set array to the ArraySource
     * @method setArray
     * @param {Array|fw/ArrayModel} array - set Array to the ArraySource
     */
    setArray(array) {
        var n, l;
        // Update the source
        if (array instanceof Array) {
            this.source.setArray(array);
        }
        // If array is an instance of fw/ArrayModel, get the array stored
        else if (ArrayModel.isInstance(array)) {
            this.source.setArray(array.getArray());
        }
        // Define an empty ArraySource if it's not defined
        else {
            this.source.clear();
        }
        // Refresh all elements bound to the ArraySource
        for (n = 0, l = this.elements.length; n < l; n++) {
            this.elements[n].synchronize('init');
        }
        // Call onChangeSource if exists
        if (types.isFunction(this.onChangeSource)) {
            this.onChangeSource(this.source);
        }
    }
    /**
     * Set default object to the ArraySource
     * @method setDefaultItem
     * @param {Object|fw/ObjectModel} defaultItem - set default item to the ArraySource
     */
    setDefaultItem(defaultItem) {
        // Check if a defaultItem is defined
        if (types.isObject(defaultItem)) {
            this.defaultItem = defaultItem;
        }
        // If defaultItem is an instance of fw/ObjectModel, get the object stored
        else if (ObjectModel.isInstance(defaultItem)) {
            this.defaultItem = defaultItem.getObject();
        }
        // Create an empty defaultItem
        else {
            this.defaultItem = {};
        }
    }
    /**
     * Get default object from the ArraySource
     * @method getDefaultItem
     * @return {Object} defaultItem
     */
    getDefaultItem() {
        return this.defaultItem;
    }
    /**
     * Return source associated to the ArraySource
     * @method getSource
     * @return {fw/ArrayModel}
     */
    getSource() {
        return this.source;
    }
    /**
     * Return model associated to the ArraySource
     * @method getModel
     * @return {fw/ArrayModel}
     */
    getModel() {
        return this.model.getModel();
    }
    /**
     * Add observer to the model
     * @method addObserver
     * @param {string} prop - observer property ('add', 'update', 'remove', 'init')
     * @param {string} obsType - observer type ('before', 'after')
     * @param {function} func - callback function called when a change occurs on the ArraySource array
     */
    addObserver() {
        return this.model.addObserver.apply(this, arguments);
    }
    /**
     * Remove observer from the model
     * @method removeObserver
     * @param {string} prop - observer property ('add', 'update', 'remove', 'init')
     * @param {string} obsType - observer type ('before', 'after')
     * @param {function} func - callback function to be removed
     */
    removeObserver() {
        return this.model.removeObserver.apply(this, arguments);
    }
    /**
     * Return array associated to the ArraySource
     * @method getArray
     * @return {Array}
     */
    getArray() {
        return this.source.getArray();
    }
    /**
     * Return the size of the source
     * @method getSize
     * @return {number}
     */
    getSize() {
        return this.source.getSize();
    }
    /**
     * Reset the source
     * @method reset
     */
    reset() {
        var n, l;
        // Clear the source;
        this.source.clear();
        // Refresh all elements bound to the ArraySource
        for (n = 0, l = this.elements.length; n < l; n++) {
            this.elements[n].refresh('init');
        }
        // Call onChangeSource if exists
        if (types.isFunction(this.onChangeSource)) {
            this.onChangeSource(this.source);
        }
    }
    /**
     * Validate all elements bound to the ArraySource
     * @method validate
     * @return {boolean}
     */
    validate() {
        var isValid = true;
        var n, l;
        var element;
        // Validate all elements
        for (n = 0, l = this.elements.length; n < l; n++) {
            element = this.elements[n];

            if (types.isFunction(element.validate) && !element.validate()) {
                isValid = false;
            }
        }
        // Check if the source is valid
        if (isValid) {
            isValid = this.source.isValid();
        }
        // Check if a custom validation function exists
        if (types.isFunction(this.onValidate)) {
            if (!this.onValidate()) {
                isValid = false;
            }
        }

        return isValid;
    }
    /**
     * Add an item to the source
     * @method add
     * @param {Object|fw/ObjectModel} item - item to be added to the source
     * @return {boolean} - Return true if the item is added
     */
    add(item) {
        var n, l;
        // Check if the item is not present in the source (prevent duplicate)
        if (this.source.indexOf(item) !== -1) return false;
        // Add the item to the source
        if (types.isObject(item) || ObjectModel.isInstance(item)) {
            this.source.add(item);
            // Define the item from the DefaultItem
        } else {
            this.source.add(this.defaultItem);
        }
        // Refresh all elements bound to the ArraySource
        for (n = 0, l = this.elements.length; n < l; n++) {
            this.elements[n].synchronize('add', this.source.getSize() - 1);
        }
        // Call onChange if exists
        if (types.isFunction(this.onChange)) {
            this.onChange(this.source);
        }
        // Call onAdd if exists
        if (types.isFunction(this.onAdd)) {
            this.onAdd(item);
        }

        return true;
    }
    /**
     * Update an item into the source
     * @method update
     * @param {Object|fw/ObjectModel} item - item to be updated to the source
     * @return {boolean} - Return true if the item is updated
     */
    update(item) {
        var index = this.source.indexOf(item);
        var n, l;//, element, page, numRow;
        // Check if the item is present in the source
        if (index === -1) return false;
        // Update the item
        this.source.set(index, item);
        // Refresh all elements bound to the ArraySource
        for (n = 0, l = this.elements.length; n < l; n++) {
            this.elements[n].synchronize('update', index);
        }
        // Call onChange if exists
        if (types.isFunction(this.onChange)) {
            this.onChange(this.source);
        }
        // Call onUpdate if exists
        if (types.isFunction(this.onUpdate)) {
            this.onUpdate(item);
        }

        return true;
    }
    /**
     * Remove an item from the source
     * @method remove
     * @param {Object|fw/ObjectModel} item - item to be removed from the source
     * @return {boolean} - Return true if the item is removed
     */
    remove(item) {
        var index = this.source.indexOf(item);
        var n, l;
        // Check if the item is present in the source
        if (index === -1) return false;
        // Remove the item
        this.source.remove(index);
        // Refresh all elements bound to the ArraySource
        for (n = 0, l = this.elements.length; n < l; n++) {
            this.elements[n].synchronize('delete', index);
        }
        // Call onChange if exists
        if (types.isFunction(this.onChange)) {
            this.onChange(this.source);
        }
        // Call onUpdate if exists
        if (types.isFunction(this.onDelete)) {
            this.onDelete(item);
        }

        return true;
    }
    /**
     * Get the item at the specified index
     * @method get
     * @param {number} index - index of the item
     * @return {fw/ObjectModel}
     */
    get(index) {
        return this.source.get(index);
    }
    /**
     * Iterate over the array
     * @method forEach
     * @param {function} func - function to be called at each item of the array
     */
    forEach(func) {
        this.source.forEach(func);
    }
    /**
     * Get the index of the item
     * @method indexOf
     * @param {Object|fw/ObjectModel} item - item to be retrieved
     * @return {number}
     */
    indexOf(item) {
        return this.source.indexOf(item);
    }
    /**
     * Refresh all elements bound to the ArraySource
     * @method refresh
     */
    refresh() {
        var n, l;

        for (n = 0, l = this.elements.length; n < l; n++) {
            this.elements[n].refresh();
        }
    }
}

module.exports = ArraySource;
