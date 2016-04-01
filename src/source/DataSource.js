/**
 * @module fw/source/DataSource
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var FwElement = require('../ui/Element');
var ObjectModel = require('../ObjectModel');
var Source = require('../source/Source');
var SourceError = require('../error/SourceError');
var types = require('../types');
var utils = require('../utils');
var ValidatorFactory = require('../validator/ValidatorFactory');
var id = 0;

/**
 * Create an instance of fw/source/DataSource associated with all form elements
 * @class
 * @alias module:fw/source/DataSource
 * @augments fw/source/Source
 * @param {Object} config - the configuration object of the DataSource
 * @param {fw/ObjectModel} [config.model] - defined model based on fw/ObjectModel
 * @param {Object|fw/ObjectModel} [config.object] - object injected to the DataSource model
 * @param {Object|fw/ObjectModel} [config.defaultObject] - default object, restored when the DataSource is reset
 * @param {function} [config.onChangeSource] - called when the source is updated
 * @param {function} [config.onChange] - called when a value is updated
 * @param {function} [config.onReset] - called when the DataSource is reset
 * @param {function} [config.onValidate] - called when the DataSource is validated. If this function returns false value, the DataSource becomes invalid.

*/
class DataSource extends Source {
    /**
     * @constructor
     */
    constructor(config) {
        var self = this;

        this.config = config || {};
        this.elements = [];
        this.elementsByProperty = {};
        this.onChangeSource = this.config.onChangeSource || null;
        this.onChange = this.config.onChange || null;
        this.onReset = this.config.onReset || null;
        this.onValidate = this.config.onValidate || null;
        // Check if the model is defined
        if (ObjectModel.isClass(this.config.model)) {
            this.model = this.config.model;
        }
        // If model is an object, create a fw/ObjectModel class with model as configuration
        else if (types.isObject(this.config.model)) {
            this.model = ObjectModel(this.config.model); // jshint ignore:line
        }
        // Create an empty fw/ObjectModel class if model is not defined
        else {
            this.model = ObjectModel({ observers: this.config.observers }); // jshint ignore:line
        }
        this.id = id++;
        console.log('====================================================');
        console.log('LOG');
        console.log('ID:' + this.id);
        console.log('instantiate DataSource');
        console.log(this.model.config.observers);
        console.log('====================================================');
        // Add an observer to the fw/ObjectModel class that will observe updates and synchronize the DataSource
        this.model.addObserver('after', function(prop, value) { self.synchronize(this, prop); });
        console.log('====================================================');
        console.log('LOG');
        console.log('ID:' + this.id);
        console.log('observers bound');
        console.log(this.model.config.observers);
        console.log('====================================================');
        // Check if a defaultObject is defined
        if (ObjectModel.isInstance(this.config.defaultObject)) {
            this.defaultObject = this.config.defaultObject.getObject();
        } else if (types.isObject(this.config.defaultObject)) {
            this.defaultObject = this.config.defaultObject;
        }
        // Create an empty defaultObject if it's not defined
        else {
            this.defaultObject = {};
        }
        // Create the source
        if (types.isObject(this.config.object)) {
            this.source = new this.model(this.config.object);
        }
        // If object is an instance of fw/ObjectModel, get the object stored
        else if (ObjectModel.isInstance(this.config.object)) {
            this.source = new this.model(this.config.object.getObject());
        }
        // Define the source from the defaultObject
        else {
            this.source = new this.model(this.defaultObject);
        }
    }
    /**
     * This function is triggered when a property in the source is updated
     * @method synchronize
     * @private
     */
    synchronize(objectModel, prop) {
        var value, n, l, i, j, el, elementsPath, elementPath;
        // Get elements associated with the property
        elementsPath = this.getElementsPath(prop);

        for (n = 0, l = elementsPath.length; n < l; n++) {
            elementPath = elementsPath[n];
            value = objectModel.get(elementPath.property);
            // Synchronize all elements
            for (i = 0, j = elementPath.elements.length; i < j; i++) {
                el = elementPath.elements[i];

                if (!el.sync) {
                    // Set element synchronized
                    el.sync = true;
                    // If element accepts one way binding, then refresh source with element value
                    if (el.oneWayBinding) {
                        if (value !== el.value) {
                            value = el.value;
                            this.source.set(elementPath.property, value);
                        }
                    } else {
                        el.setValue(value);
                    }
                    // Remove element synchronization
                    el.sync = false;
                }
            }
            // Call onChange if exists
            if (types.isFunction(this.onChange)) {
                this.onChange(elementPath.property, value);
            }
        }
    }
    /**
     * Reset the DataSource and set the defaultObject as value to the source
     * @method reset
     */
    reset() {
        var n, l, element;
        // Reset all elements registered
        for (n = 0, l = this.elements.length; n < l; n++) {
            element = this.elements[n];

            if (types.isFunction(element.reset)) {
                element.reset();
            }
        }
        // Set the defaultObject as value to the source
        this.source.setObject(this.defaultObject);
        // Call onChangeSource if exists
        if (types.isFunction(this.onChangeSource)) {
            this.onChangeSource(this.source);
        }
        // Call onReset if exists
        if (types.isFunction(this.onReset)) {
            this.onReset(this.source);
        }
    }
    /**
     * Bind element(s) to the DataSource
     * @method bind
     * @param {fw/ui/Element|fw/ui/Element[]} element(s) - element or array of elements to bind to the DataSource
     * @param {string} [property] - property of the element bound to the DataSource
     */
    bind() {
        console.log('====================================================');
        console.log('LOG');
        console.log('ID:' + this.id);
        console.log('binding DataSource');
        console.log(this.model.config.observers);
        console.log('====================================================');
        var self = this;
        var elements = arguments[0];
        var configModified = false;
        var config = {};
        var n, l, property, els;
        // Adapt model with the element bound
        function addElement(el) {
            var elClass = el.constructor;
            var propName = 'fields' + el.property; 
            var elConf = {};
            var propConf = utils.getValueFromObject(config, propName) || {};
            var propValidators = propConf.validators || [];
            var modelType;
            var validators, validator;
            var propertyArray, prop;
            var value, i, j, n, l;

            // If type is defined for the element, check if it matches the property type in the model
            if (!types.isEmptyString(elClass.type) || types.isFunction(elClass.type)) {
                if (propConf.type !== undefined && propConf.type !== elClass.type) {
                    throw new SourceError({
                        sourceName: 'fw/source/DataSource',
                        message:    'type for property "' + el.property + '"has been already defined',
                        origin:     '"bind" method',
                        element:    el
                    });
                }

                modelType = self.model.getType(el.property);

                if (modelType !== undefined) {
                    if (modelType !== elClass.type) {
                        throw new SourceError({
                            sourceName: 'fw/source/DataSource',
                            message:    'type for property "' + el.property + '"has been already defined',
                            origin:     '"bind" method',
                            element:    el                   
                        });
                    }
                } else {
                    elConf.type = elClass.type;
                }
            } 

            // Set validators if defined in the element
            validators = ValidatorFactory.getValidators(el);
            l = validators.length;

            if (l > 0) {
                j = propValidators.length;

                for (n = 0, l = validators.length; n < l; n++) {
                    validator = validators[n];

                    for (i = 0, j = propValidators.length; i < j; i++) {
                        if (propValidators[i].constructor === validator.constructor) {
                            throw new SourceError({
                                sourceName: 'fw/source/DataSource',
                                message:    'validator "' + validator.constructor.name + '" for property "' + el.property + '"has been already defined',
                                origin:     '"bind" method',
                                element:    el
                            });
                        }
                    }
                }

                elConf.validator = propValidators.concat(validators);
            }

            // Check if changes must be done on the model
            if (!types.isEmptyObject(elConf)) {
                utils.setValueToObject(config, 'fields.' + el.property, elConf);
                configModified = true;
            }
            // Set the dataSource in the element
            el.dataSource = self;
            // Register the element in the DataSource
            self.elements.push(el);
            // Split property string into subproperties
            propertyArray = el.property.split('.');

            for (i = 0, j = propertyArray.length; i < j; i++) {
                prop = propertyArray[i];
                // Check if parent property exists in the properties store of the DataSource
                if (i === 0) {
                    els = self.elementsByProperty[prop];
                    // If not defined, reset the store for this property
                    if (els === undefined) {
                        els = self.elementsByProperty[prop] = {
                            properties: {},
                            elements: []
                        };
                    }
                } else if (els.properties[prop] === undefined) {
                    els = els.properties[prop] = {
                        properties: {},
                        elements:   []
                    };
                }
            }
            // Add element to the properties store of the DataSource
            els.elements.push(el);
            // Get the value of the DataSource for the element
            value = self.source.get(el.property);
            // Set element synchronized
            el.sync = true;
            // If element accepts one way binding, then refresh source with element value
            if (el.constructor.oneWayBinding) {
                if (value !== el.value) {
                    value = el.value;
                    self.source.set(el.property, value);
                }
            } else {
                el.setValue(value);
            }
            // Remove element synchronization
            el.sync = false;
            // Trigger binding in the element if defined
            if (types.isFunction(el.bindDataSource)) {
                el.bindDataSource(self);
            }
        }
        // Process element
        function processElement(element, property) {
            if (!(element instanceof FwElement)) return;
            
            if ((element.dataSource !== self) && (element.dataSource instanceof DataSource)) {
                element.dataSource.unbind(element); 
            }

            if (types.isString(property)) { 
                element.property = property;
            }

            if (self.elements.indexOf(element) !== -1) { 
                self.unbind(element); 
            }
            
            if (!types.isEmptyString(element.property)) {
                addElement(element);
            }
        }
        console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++');
        console.log('LOG');
        console.log('Process Element DataSource:' + this.id);
        console.log(this.model.config.observers);
        // Check if we bind an array of elements
        if (elements instanceof Array) {
            for (n = 0, l = elements.length; n < l; n++) {
                processElement(elements[n]);
            }
        } else {
            processElement(arguments[0], arguments[1]);
        }
        // Extend the model if changes must be applied
        if (configModified) {
            console.log('config modified:');
            console.log(this.model.config.observers);
            this.model = this.model.extend(config);
            this.source = new this.model(this.source.getObject());
        }
        console.log('after:' + this.elements.length);
        console.log(this.model.config.observers);
        console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    }
    /**
     * Unbind element(s) from the DataSource
     * @method unbind
     * @param {fw/ui/Element|fw/ui/Element[]} element(s) - element or array of elements to unbind from the DataSource
     */
    unbind() {
        var self = this;
        var elements = arguments[0];
        var n, l;
        // Remove the element from the DataSource
        function removeElement(path, element) {
            if (path === undefined) return false;

            var i, j, prop;

            for (i = 0, j = path.elements.length; i < j; i++) {
                if (path.elements[i] === element) {
                    path.elements.splice(i, 1);
                    return true;
                }
            }
            for (prop in path.properties) {
                if (removeElement(path.properties[prop], element)) return true;
            }

            return false;
        }
        // Process element
        function processElement(element) {
            if (!(element instanceof FwElement)) return;
            var index;

            index = self.elements.indexOf(element);

            if (index !== -1) {
                removeElement(self.elementsByProperty, element);
                self.elements.splice(index, 1);
                element.dataSource = null;
            }
        }
        console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++');
        console.log('LOG');
        console.log('unbind DataSource:' + this.id);
        console.log('before:' + this.elements.length);
        // Check if we bind an array of elements
        if (elements instanceof Array) {
            for (n = 0, l = elements.length; n < l; n++) {
                processElement(elements[n]);
            }
        } else {
            processElement(arguments[0]);
        }
        console.log('after:' + this.elements.length);
        console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    }
    /**
     * Set value to a property of DataSource
     * @method setValue
     * @param {string} property - property affected
     * @param {*} value - value assigned to property
     */
    setValue(property, value) {
        this.source.set(property, value);
    }
    /**
     * Set values to the DataSource
     * @method setValues
     * @param {Object} values - values assigned structured as key-value pairs
     */
    setValues(values) {
        this.source.setValues(values);
    }
    /**
     * Return an element path from a property
     * @method getElementsPath
     * @private
     * @param {string} property - property for which we want to retrieve the path
     * @return {Array} path
     */
    getElementsPath(property) {
        var propertyArray = property.split('.');
        var propString = '';
        var path = [];
        var n, l, nextPropString, els, prop, baseProp;

        function fetchDescElements(base, basePropString) {
            var propFound = false;
            var elementPath;

            for (prop in base.properties) {
                elementPath = undefined;
                baseProp = base.properties[prop];
                nextPropString = basePropString + '.' + prop;

                if (baseProp.elements.length > 0) {
                    elementPath = {
                        property: nextPropString,
                        elements: baseProp.elements
                    };
                    path.push(elementPath);
                }

                if (!fetchDescElements(baseProp, nextPropString)) {
                    if (elementPath !== undefined) {
                        elementPath.lastPath = true;
                    }
                }

                propFound = true;
            }

            return propFound;
        }

        for (n = 0, l = propertyArray.length; n < l; n++) {
            prop = propertyArray[n];

            if (n === 0) {
                els = this.elementsByProperty[prop];
                propString = prop;
            } else {
                els = els.properties[prop];
                propString += '.' + prop;
            }

            if (els === undefined) break;

            if (els.elements.length > 0) {
                path.push({
                    property: propString,
                    elements: els.elements
                });
            }
        }

        l = path.length;

        if (els !== undefined) {
            if (!fetchDescElements(els, propString) && l > 0) {
                path[l - 1].lastPath = true;
            }
        } else if (l > 0) {
            path[l - 1].lastPath = true;
        }

        return path;
    }
    /**
     * Get value of a property
     * @method getValue
     * @param {string} property - property
     * @return {*}
     */
    getValue(property) {
        return this.source.get(property);
    }
    /**
     * Set object to the DataSource
     * @method setObject
     * @param {Object|fw/ObjectModel} object - set Object to the DataSource
     */
    setObject(object) {
        var n, l, element;
        // Update the source
        this.source.setObject((types.isObject(object) || ObjectModel.isInstance(object)) ? object : this.defaultObject);
        // Reset all elements. Remove field errors
        for (n = 0, l = this.elements.length; n < l; n++) {
            element = this.elements[n];

            if (types.isFunction(element.reset)) {
                element.reset();
            }
        }
        // Call onChangeSource if exists
        if (types.isFunction(this.onChangeSource)) {
            this.onChangeSource(this.source);
        }
    }
    /**
     * Set default object to the DataSource
     * @method setDefaultObject
     * @param {Object|fw/ObjectModel} defaultObject - set default Object to the DataSource
     */
    setDefaultObject(defaultObject) {
        // Check if a defaultObject is defined
        if (types.isObject(defaultObject)) {
            this.defaultObject = defaultObject;
        }
        // If defaultObject is an instance of fw/ObjectModel, get the object stored
        else if (ObjectModel.isInstance(defaultObject)) {
            this.defaultObject = defaultObject.getObject();
        }
        // Create an empty defaultObject
        else {
            this.defaultObject = {};
        }
    }
    /**
     * Get default object from the DataSource
     * @method getDefaultObject
     * @return {Object} defaultObject
     */
    getDefaultObject() {
        return this.defaultObject;
    }
    /**
     * Return source associated to the DataSource
     * @method getSource
     * @return {fw/ObjectModel}
     */
    getSource() {
        return this.source;
    }
    /**
     * Return model associated to the DataSource
     * @method getModel
     * @return {fw/ObjectModel}
     */
    getModel() {
        return this.model;
    }
    /**
     * Add observer to the model
     * @method addObserver
     * @param {string} [prop] - property observed. If property is not mentionned, the observer is global
     * @param {string} obsType - observer type ('before', 'after', 'validation')
     * @param {function} func - callback function called when a change occurs on the DataSource object
     * @return {fw/ObjectModel~ObjectModelClass}
     */
    addObserver() {
        return this.model.addObserver.apply(this, arguments);
    }
    /**
     * Remove observer from the model
     * @method removeObserver
     * @param {string} [prop] - property from which the observer is removed. If property is not mentionned, the observer is global
     * @param {string} obsType - observer type ('before', 'after', 'validation')
     * @param {function} func - callback function to be removed
     * @return {fw/ObjectModel~ObjectModelClass}
     */
    removeObserver() {
        return this.model.removeObserver.apply(this, arguments);
    }
    /**
     * Return object associated to the source
     * @method getObject
     * @return {Object}
     */
    getObject() {
        return this.getSource().getObject();
    }
    /**
     * Clear the source
     * @method clear
     */
    clear() {
        this.setObject({});
    }
    /**
     * Validate all elements bound to the DataSource
     * @method validate
     * @param {string} [property] - validate all elements with the specified property
     * @return {boolean}
     */
    validate(property) {
        var isValid = true;
        var n, l, element;
        // Validate all elements with the specified property
        if (types.isString(property)) {
            for (n = 0, l = this.elements.length; n < l; n++) {
                element = this.elements[n];

                if (element.property === property && types.isFunction(element.validate) && !element.validate()) {
                    isValid = false;
                }
            }
        }
        // Validate all elements
        else {
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
        }

        return isValid;
    }
    /**
     * Set errors to the DataSource
     * @method setErrors
     * @param {Object} errors - errors structured as key-value pairs
     */
    setErrors(errors) {
        if (!types.isObject(errors)) return;

        var property, n, l, element;
        // Set errors on elements
        for (property in errors) {
            for (n = 0, l = this.elements.length; n < l; n++) {
                element = this.elements[n];

                if (element.property === property) {
                    if (types.isFunction(element.setError)) {
                        element.setError(errors[property]);
                    }
                }
            }
        }
    }
    /**
     * Check if source is empty
     * @method isEmpty
     * @return {boolean}
     */
    isEmpty() {
        return this.source.isEmpty();
    }
}

module.exports = DataSource;
