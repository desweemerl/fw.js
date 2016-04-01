/**
 * @module fw/ObjectModel
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var CheckValidator = require('./validator/CheckValidator');
var FwCurrency = require('./type/Currency');
var FwDate = require('./type/Date');
var FwInteger = require('./type/Integer');
var FwNumber = require('./type/Number');
var FwTime = require('./type/Time');
var FwTimestamp = require('./type/Timestamp');
var ModelError = require('./error/ModelError');
var RequiredValidator = require('./validator/RequiredValidator');
var types = require('./types');
var utils = require('./utils');
var Validator = require('./validator/Validator');
var ValidatorFactory = require('./validator/ValidatorFactory');

var id = { name: 'ObjectModelClass' };

// Types registered into the ObjectModel
var allTypes = [FwCurrency, FwNumber, FwInteger, FwDate, FwTime, FwTimestamp, 'ArrayModel', 'string', 'number', 'boolean', 'array', 'object'];
/**
 * @typedef fieldOption
 * @property {string|CustomeType} [type] - field type ("*", "number", "string", "boolean", "array", "object", FwNumber, FwCurrency, ...)
 * @property {function} [set] - function(value) set function assigned to the field, acting as value transformer before storing value in the object
 * @property {function} [get] - get function assigned to the field, return a value when retrieving a property from the object
 * @property {Object} [defaultValue] - field default value
 * @property {<fw/validator/Validator>.[]} [validators] - validators assigned to the field
 * @property {function|Object} [observer] - equivalent to observer.after if a function is defined
 * @property {function} [observer.before] - function(value, flag) observer triggered before assiging a value to the field
 * @property {function} [observer.after] - function(value, flag) observer triggered after assigning a value to the field
 * @property {function} [observer.validation] - function(value, flag) observer triggered after validation of the field
 */
/**
 * The fw/ObjectModel class brings types checking, observers and validators to Javascript Objects
 * @function
 * @alias module:fw/ObjectModel
 * @param {Object} options - ObjectModel options
 * @param {Object} [options.fields] - fields options
 * @param {Object.<string, fieldOption>} [options.fields.*]
 * @param {function} [options.equals] - define equals function for object comparison
 * @param {function|Object} [options.observer] - equivalent to observer.after if a function is defined
 * @param {function} [options.observer.before] - function(property, value, flag) observer triggered before assigning a value to any fields
 * @param {function} [options.observer.after] - function(property, value, flag) observer triggered after assigning a value to any field
 * @param {function|Object} [options.observer.init] - equivalent to observer.init.after if a function is defined
 * @param {function} [options.observer.init.before] - function(object) observer triggered before assigning an object
 * @param {function} [options.observer.init.after] - function(object) observer triggered after assigning an object
 */
function ObjectModel(options, objectModelClass) {
     // Define options
    options = options || {};
    // Check objectModelClass existence for inheritance
    var config = objectModelClass && objectModelClass.id === id ? objectModelClass.config : {};
    // Setup config
    config.types = config.types || {};
    config.options = config.options || {};
    config.get = config.get || {};
    config.set = config.set || {};
    config.validators = config.validators || {};
    config.observers = config.observers || {};
    config.observers.init = config.observers.init || {};
    config.observers.props = config.observers.props || {};
    config.observers.props.before = config.observers.props.before || {};
    config.observers.props.after = config.observers.props.after || {};
    config.equals = config.equals || function (object) { return this === object; };
    // Create configuration for fields options
    lookupProperty('', options.fields);
    // Define equals function if defined
    if (types.isFunction(options.equals)) {
        config.equals = options.equals;
    }
    // Check for global observers
    options.observer = options.observer || {};
    options.observer.init = options.observer.init || {};
    addObservers(config.observers, options.observer);
    addObservers(config.observers, options.observer.init, 'init');
    // Check observer duplicate and add observer
    function addObserver(object, observer, prop, type) {
        type = type || 'after';
        var property = prop ? [type, prop].join('.') : type;
        var target = utils.getValueFromObject(object, property);

        if (target) {
            if (target.indexOf(observer) !== -1) {
                throw new ModelError({
                    modelName: 'fw/ObjectModel',
                    message:   type + ' observer "' + observer.constructor.name + ' for prop' + prop + 'is already registered',
                    origin:    '"addObserver" function'
                });           
            }
            target.push(observer);
        } else {
            utils.setValueToObject(object, property, [observer]);
        }
    }
    // Add observer to object
    function addObservers(object, obs, prop) {
        if (types.isFunction(obs)) {
            addObserver(object, obs, prop);
        } else if (types.isObject(obs)) {
            if (types.isFunction(obs.before)) {
                addObserver(object, obs.before, prop, 'before');
            }

            if (types.isFunction(obs.after)) {
                addObserver(object, obs.before, prop);
            }
        }
    }
    // Set value to config
    function setValue(base, object, svProp, svValue) {
        var key = svProp === null ? base : (base.length > 0 ? base + '.' : '') + svProp;
        var definedValue = utils.getValueFromObject(object, key, svValue);

        if (definedValue !== undefined) {
            if (svValue !== definedValue) {
                throw new ModelError({
                    modelName: 'fw/ObjectModel',
                    message:   svProp + ' for "' + base + '" is already defined',
                    origin:    '"setValue" function'
                });
            }

            return;
        }  
        
        utils.setValueToObject(object, key, svValue);
    }
    // Add validator to object
    function addValidators(object, validators, prop) {
        validators = validators instanceof Array ? validators : [validators];

        var target = utils.getValueFromObject(object, prop);
        var validator, found;
        var i, j, n, l;

        if (target === undefined) {
            target = [];
            utils.setValueToObject(object, prop, target);
        }       

        for (n = 0, l = validators.length; n < l; n++) {
            validator = validators[n];
            found = false;

            if (!(validator instanceof Validator)) {
                throw new ModelError({
                    modelName: 'fw/ObjectModel', 
                    message:   types.isObject(validator) ? 
                                   validator.constructor.name + ' for "' + prop + '" is not a validator' : 
                                   'wrong validator for "' + prop + '"',
                    origin:    '"addValidators" function'
                });
            }

            for (i = 0, j = target.length; i < j; i++) {
                if (target[i].constructor === validator.constructor) {
                    target[i] = validator;
                    found = true;
                    break;
                }
            }

            if (!found) {
                target.push(validator);
            }
        }
    }

    // Configure the class
    function lookupProperty(base, obj) {
        var isRoot = base.length === 0;
        var definedValue, value; 
        var prop, propFound;

        for (prop in obj) {
            value = obj[prop];
            propFound = false;

            if (value !== null && value !== undefined) {
                if (!isRoot && prop === 'type' && allTypes.indexOf(value) !== -1) {
                    setValue(base, config.types, null, value);
                    propFound = true;
                } else if (!isRoot && prop === 'defaultValue') {
                    setValue(base, config.options, 'defaultValue', value);
                    propFound = true;
                } else if (!isRoot && prop === 'get' && types.isFunction(value)) {
                    setValue(base, config.get, null, value);
                    propFound = true;
                } else if (!isRoot && prop === 'set' && types.isFunction(value)) {
                    setValue(base, config.set, null, value);
                    propFound = true;
                } else if (!isRoot && prop === 'observer') {
                    if (types.isFunction(value)) {
                        addObserver(config.observers.props, value, base); 
                        propFound = true;
                    } else if (types.isObject(value)) {
                        if (types.isFunction(value.before)) {
                            addObserver(config.observers.props, value.before, base, 'before'); 
                            propFound = true;
                        }

                        if (types.isFunction(value.after)) {
                            addObserver(config.observers.props, value.after, base); 
                            propFound = true;
                        }

                        if (types.isFunction(value.validation)) {
                            addObserver(config.observers.props, value.validation, base, 'validation'); 
                            propFound = true;
                        }                       
                    }
                } else if (!isRoot && prop === 'validator') {
                    if (value instanceof Array) {
                        addValidators(config.validators, value, base);
                    } else if (types.isObject(value)) {
                        addValidators(config.validators, ValidatorFactory.getValidators(value), base);
                    }
                    propFound = true;
                }

                if (!propFound && value.constructor === Object) {
                    lookupProperty((!isRoot ? base + '.' : '') + prop, value);
                }
            }
        }
    }
    // Process validation for a property
    function processPropValidation(self, prop, value, validators) {
        if (validators === undefined || validators.length === 0) return;

        var isProcessed = false;
        var output, key, error;
        var n, l; 

        for (n = 0, l = validators.length; n < l; n++) {
           isProcessed = true; 
           output = validators[n].validate(value, self); 

           for (key in output) {
                error = output[key];

                if (error) {
                    self.invalidFields[prop] = self.invalidFields[prop] || {};
                    self.invalidFields[prop][key] = error;
                } else {
                    if (self.invalidFields[prop]) {
                        delete self.invalidFields[prop][key];
 
                        if (types.isEmptyObject(self.invalidFields[prop])) {
                            delete self.invalidFields[prop];
                        }                             
                    }
                }
           }
        }

        return isProcessed;
    }
    // Process value for a property (type checking and custom type instantiation)
    function processPropValue(self, prop, lookup, value, options) {
        if (lookup === undefined) return;
        options = options || {};

        var defaultValue = false;
        var key, returnValue;

        if (types.isObject(lookup)) {
            if (types.isObject(value)) {
                for (key in lookup) {
                    returnValue = processPropValue(self, prop + '.' + key, lookup[key], value[key], options[key]);

                    if (returnValue !== undefined) {
                        value[key] = returnValue;
                    }
                }
            } 
        } else if (types.isString(lookup)) {
            if (value === undefined || value === null) {
                if (options.defaultValue === undefined || options.defaultValue === null)  {
                    if (options.notNull) {
                        throw new ModelError({
                            modelName: self.constructor.name,
                            message:   'property "' + prop + '" is null',
                            origin:    '"processPropValue" function'
                        });
                    } else {
                        return value;
                    }
                } else {
                    value = options.defaultValue;  
                    defaultValue = true;
                }
            }

            switch (lookup) {
                case 'string':
                    if (!types.isString(value)) {
                        throw new ModelError({
                            modelName: self.constructor.name,
                            message:   'property "' + prop + '" is not a string type',
                            origin:    '"processPropValue" function'
                        });
                    }

                    if (defaultValue) return value;

                    break;
                case 'number':
                    if (!types.isValidNumber(value)) {
                        throw new ModelError({
                            modelName: self.constructor.name,
                            message:   'property "' + prop + '" is not a number type',
                            origin:    '"processPropValue" function'
                        });
                    }

                    if (defaultValue) return value;

                    break;
                case 'boolean':
                    if (!types.isBoolean(value)) {
                        throw new ModelError({
                            modelName: self.constructor.name,
                            message:   'property "' + prop + '" is not a boolean type',
                            origin:    '"processPropValue" function'
                        });
                    }

                    if (defaultValue) return value;

                    break;
                case 'array':
                    if (!(value instanceof Array)) {
                        throw new ModelError({
                            modelName: self.constructor.name,
                            message:   'property "' + prop + '" is not an array type',
                            origin:    '"processPropValue" function'
                        });
                    }

                    if (defaultValue) return utils.copyArray(value);

                    break;
                case 'object':
                    if (!types.isObject(value)) {
                        throw new ModelError({
                            modelName: self.constructor.name,
                            message:   'property "' + prop + '" is not an object type',
                            origin:    '"processPropValue" function'
                        });
                    }

                    if (defaultValue) return utils.copyObject(value);

                    break;
            }
        } else if (types.isFunction(lookup)) {
            if ((value === undefined || value === null) && (options.defaultValue !== undefined && options.defaultValue !== null)) {
                return new lookup(options.defaultValue); // jshint ignore:line
            } else if (!(value instanceof lookup)) {
                return new lookup(value); // jshint ignore:line
            }
        }
    }
    // Fetch the result of a get function if defined
    function fetchGetObject(self, lookup, object) {
        if (lookup === undefined) return;

        var key, returnFunction;

        if (types.isObject(lookup)) {
            object = object || {};

            for (key in lookup) {
                returnFunction = fetchGetObject(self, lookup[key], object[key]);
                if (returnFunction !== undefined) {
                    object[key] = returnFunction;
                }
            }

            return object;
        } else if (types.isFunction(lookup)) {
            return lookup.call(self);
        }
    }
    // Fetch the result of a set function if defined
    function fetchSetObject(self, lookup, value, object, flag) {
        if (lookup === undefined) return;

        var key, returnFunction;

        if (types.isObject(lookup)) {
            object = object || {};

            if (!types.isObject(value)) {
                value = {};
            }

            for (key in lookup) {
                returnFunction = fetchSetObject(self, lookup[key], value[key], object[key], flag);

                if (returnFunction !== undefined) {
                    object[key] = returnFunction;
                }
            }

            return object;
        } else if (types.isFunction(lookup)) {
            return lookup.call(self, value, flag);
        }
    }
    // Fire an observer if defined
    function fireObserversObject(self, lookup, value, flag) {
        if (lookup === undefined) return;

        var key, n, l;

        if (lookup instanceof Array) {
            for (n = 0, l = lookup.length; n < l; n++) {
                lookup[n].call(self, value, flag);
            }
        } else if (types.isObject(lookup)) {
            if (!types.isObject(value)) {
                value = {};
            }

            for (key in lookup) {
                fireObserversObject(self, lookup[key], value[key], flag);
            }
        }
    }

    /**
     * The ObjectModelClass is only created with fw/ObjectModel function
     * @class fw/ObjectModel~ObjectModelClass
     * {@link fw/ObjectModel}
     * @param {Object|fw/ObjectModel} object
     */
    class ObjectModelClass {
        /**
         * @constructor
         */
        constructor(object) {
            this.setObject(object);
        }
        /**
         * define id
         * @property id
         */
        static get id () {
            return id;
        }       
        /**
         * define parent
         * @property parent
         */
        static get parent() {
            return ObjectModel;
        }
        /**
         * define config
         * @property config
         */
        static get config() {
            return config;
        }
        /**
         * Get options of a property
         * @method fw/ObjectModel~ObjectModelClass.getOptions
         * @static
         * @param {string} prop - property for which we want to know the options
         * @return {Object}
         */
        static getOptions(prop) {
            return utils.getValueFromObject(config.options, prop);
        }
        /**
         * Get an option of a property
         * @method fw/ObjectModel~ObjectModelClass.getOption
         * @static
         * @param {string} prop - property for which we want to know the option
         * @param {string} key - option name
         * @return {string|Object}
         */
        static getOption(prop, key) {
            var options = utils.getValueFromObject(config.options, prop);

            return (options === undefined) ? undefined : options[key];
        }       
        /**
         * Get a type from a specified property
         * @method fw/ObjectModel~ObjectModelClass.getType
         * @static
         * @param {string} prop - property for which wa want to know the type
         * @return {string|CustomType}
         */
        static getType(prop) {
            return utils.getValueFromObject(config.types, prop);
        }
        /**
         * Extend a model
         * @method fw/ObjectModel~ObjectModelClass.extend
         * @param {Object} options - options that will be merged with the object model
         * @return {fw/ObjectModel~ObjectModelClass}
         */
        static extend(options) {
            return ObjectModel(options, ObjectModelClass); // jshint ignore:line
        }
        /**
         * Add observer to ObjectModelClass
         * @method fw/ObjectModel~ObjectModelClass.addObserver
         * @static
         * @param {string} [prop] - if not defined, the observer is global
         * @param {string} obsType - observer type ("before", "after", "validation")
         * @param {function} cb - function(value, flag} observer function, where flag can be "init", "update" or "validate"
         * @return {fw/ObjectModel~ObjectModelClass}
         */
        static addObserver() {
            var prop, obsType, cb, array, observersProp;

            if (arguments.length === 2) {
                obsType = arguments[0];
                cb = arguments[1];
            } else if (arguments.length > 2) {
                prop = arguments[0];
                obsType = arguments[1];
                cb = arguments[2];
            }

            if (types.isFunction(cb)) {
                if (types.isString(prop) && types.inArray(obsType, ['before', 'after', 'validation'])) {
                    addObserver(config.observers.props, cb, prop, obsType);
                } else {
                    if (obsType === 'before') {
                        addObserver(config.observers, cb, null, 'before');
                    } else if (obsType === 'after') {
                        addObserver(config.observers, cb, null);
                    }
                }
            }

            return this;
        }       
        /**
         * Remove observer from the ObjectModelClass
         * @method fw/ObjectModel~ObjectModelClass.removeObserver
         * @static
         * @param {string} [prop] - if not defined, the observer is global
         * @param {string} obsType - observer type ("before", "after", "validation")
         * @param {function} cb - function(value, flag} observer function, where flag can be "init", "update" or "validate"
         * @return {fw/ObjectModel~ObjectModelClass}
         */
        static removeObserver() {
            var prop, obsType, cb, index, array, observersProp;

            if (arguments.length === 2) {
                obsType = arguments[0];
                cb = arguments[1];
            } else if (arguments.length > 2) {
                prop = arguments[0];
                obsType = arguments[1];
                cb = arguments[2];
            }

            if (types.isFunction(cb)) {
                if (types.isString(prop)) {
                    if (obsType === 'before') {
                        observersProp = config.observers.props.before;
                    } else if (obsType === 'after') {
                        observersProp = config.observers.props.after;
                    } else if (obsType === 'validation') {
                        observersProp = config.observers.props.validation;
                    }

                    if (observersProp) {
                        array = utils.getValueFromObject(observersProp, prop);

                        if (array) {
                            index = array.indexOf(cb);

                            if (index !== -1) {
                                array.splice(index, 1);
                            }
                        }
                    }
                } else {
                    if (obsType === 'before') {
                        if (config.observers.before) {
                            index = config.observers.before.indexOf(cb);

                            if (index !== -1) {
                                config.observers.before.splice(index, 1);
                            }
                        }
                    } else if (obsType === 'after') {
                        if (config.observers.after) {
                            index = config.observers.after.indexOf(cb);

                            if (index !== -1) {
                                config.observers.after.splice(index, 1);
                            }
                        }
                    }
                }
            }

            return this;
        } 
        /**
         * Store a new object
         * @method setObject
         * @memberof fw/ObjectModel~ObjectModelClass
         * @inner
         * @param {Object|fw/ObjectModel} object - object or ObjectModel instance
         */
        setObject(object) {
            var setFunctionsFromProp, typeFromProp, optionsFromProp, validatorsFromProp, beforeObserversFromProp, afterObserversFromProp, n, l, setObject, prop, value, returnValue;

            this.invalidFields = {};

            if (types.isEmptyObject(object)) {
                object = {};
            }

            if (types.isFunction(object.constructor) && object.constructor.parent === ObjectModel) {
                object = object.object;
            }

            for (prop in config.types) {
                if (!object.hasOwnProperty(prop)) {
                    object[prop] = undefined;
                }
            }

            for (prop in config.set) {
                if (!object.hasOwnProperty(prop)) {
                    object[prop] = undefined;
                }
            }

            this.object = {};

            if (config.observers.init.before !== undefined) {
                for (n = 0, l = config.observers.init.before.length; n < l; n++) {
                    config.observers.init.before[n].call(this, object);
                }
            }

            for (prop in object) {
                value = object[prop];

                if (value !== undefined || !this.object.hasOwnProperty(prop)) {
                    setFunctionsFromProp = utils.getValueFromObject(config.set, prop);
                    typeFromProp = utils.getValueFromObject(config.types, prop);
                    optionsFromProp = utils.getValueFromObject(config.options, prop);
                    validatorsFromProp = utils.getValueFromObject(config.validators, prop);
                    beforeObserversFromProp = utils.getValueFromObject(config.observers.props.before, prop);
                    afterObserversFromProp = utils.getValueFromObject(config.observers.props.after, prop);

                    if (config.observers.before !== undefined) {
                        for (n = 0, l = config.observers.before.length; n < l; n++) {
                            config.observers.before[n].call(this, prop, value, 'init');
                        }
                    }

                    if (beforeObserversFromProp !== undefined) {
                        fireObserversObject(this, beforeObserversFromProp, value, 'init');
                    }

                    if (setFunctionsFromProp !== undefined) {
                        setObject = fetchSetObject(this, setFunctionsFromProp, value, 'init');

                        if (types.isObject(setObject) && types.isObject(value)) {
                            utils.extendObject(true, value, setObject);
                        } else {
                            value = setObject;
                        }
                    }

                    if (typeFromProp !== undefined) {
                        returnValue = processPropValue(this, prop, typeFromProp, value, optionsFromProp);

                        if (returnValue !== undefined) {
                            value = returnValue;
                        }
                    }

                    utils.setValueToObject(this.object, prop, value);

                    if (processPropValidation(this, prop, value, validatorsFromProp)) {
                        fireObserversObject(this, utils.getValueFromObject(config.observers.props.validation, prop), value, 'init');
                    }

                    if (afterObserversFromProp !== undefined) {
                        fireObserversObject(this, afterObserversFromProp, value, 'init');
                    }

                    if (config.observers.after !== undefined) {
                        for (n = 0, l = config.observers.after.length; n < l; n++) {
                            config.observers.after[n].call(this, prop, value, 'init');
                        }
                    }
                }
            }

            if (config.observers.init.after !== undefined) {
                for (n = 0, l = config.observers.init.after.length; n < l; n++) {
                    config.observers.init.after[n].call(this, object);
                }
            }
        }
         /**
         * Validate a property
         * @method validate
         * @memberof fw/ObjectModel~ObjectModelClass
         * @inner
         * @param {string} prop - property to be validated
         */
        validate(prop) {
            var value = this.get(prop);

            if (processPropValidation(this, prop, value, utils.getValueFromObject(config.validators, prop))) {
                fireObserversObject(this, utils.getValueFromObject(config.observers.props.validation, prop), value, 'validate');
            }
        }
        /**
         * Get the object
         * @method getObject
         * @memberof fw/ObjectModel~ObjectModelClass
         * @inner
         * @return {Object}
         */
        getObject() {
            return utils.extendObject(true, {}, this.object, fetchGetObject(this, config.get));
        }
        /**
         * Get all defined types of the class
         * @method getTypes
         * @memberof fw/ObjectModel~ObjectModelClass
         * @inner
         * @return {Object}
         */
        getTypes() {
            return config.types;
        }
        /**
         * Get a type from a specified property
         * @method getType
         * @memberof fw/ObjectModel~ObjectModelClass
         * @inner
         * @param {string} prop - property for which wa want to know the type
         * @return {string|CustomType}
         */
        getType(prop) {
            return utils.getValueFromObject(config.types, prop);
        }
        /**
         * Get the value of a property
         * @method get
         * @memberof fw/ObjectModel~ObjectModelClass
         * @inner
         * @param {string} prop - property for which wa want to retrieve the value
         * @return {*}
         */
        get(prop) {
            var getFunctionsFromProp = config.get[prop.split('.')[0]];
            var value = utils.getValueFromObject(this.object, prop);
            var getObject;

            if (getFunctionsFromProp) {
                getObject = utils.getValueFromObject(fetchGetObject(this, config.get), prop);

                return types.isObject(getObject) && !(getObject instanceof Array) && types.isObject(value) && !(getObject instanceof Array) ? utils.extendObject(true, {}, value, getObject) : getObject;
            }

            return value;
        }
        /**
         * Set the value of a property
         * @method set
         * @memberof fw/ObjectModel~ObjectModelClass
         * @inner
         * @param {string} prop - property for which we want to set a value
         * @param {*} value - value assigned to the property
         */
        set(prop, value) {
            var setFunctionsFromProp = utils.getValueFromObject(config.set, prop);
            var beforeObserversFromProp = utils.getValueFromObject(config.observers.props.before, prop);
            var afterObserversFromProp = utils.getValueFromObject(config.observers.props.after, prop);
            var typeFromProp = utils.getValueFromObject(config.types, prop);
            var optionsFromProp = utils.getValueFromObject(config.options, prop);
            var validatorsFromProp = utils.getValueFromObject(config.validators, prop);
            var setObject, returnValue, n, l;

            if (config.observers.before !== undefined) {
                for (n = 0, l = config.observers.before.length; n < l; n++) {
                    config.observers.before[n].call(this, prop, value, 'update');
                }
            }

            if (beforeObserversFromProp !== undefined) {
                fireObserversObject(this, beforeObserversFromProp, value, 'update');
            }

            if (setFunctionsFromProp !== undefined) {
                setObject = fetchSetObject(this, setFunctionsFromProp, value, 'update');

                if (types.isObject(setObject) && types.isObject(value)) {
                    utils.extendObject(true, value, setObject);
                } else {
                    value = setObject;
                }
            }

            if (typeFromProp !== undefined) {
                returnValue = processPropValue(this, prop, typeFromProp, value, optionsFromProp);

                if (returnValue !== undefined) {
                    value = returnValue;
                }
            }

            utils.setValueToObject(this.object, prop, value);

            if (processPropValidation(this, prop, value, validatorsFromProp)) {
                fireObserversObject(this, utils.getValueFromObject(config.observers.props.validation, prop), value, 'update');
            }

            if (afterObserversFromProp !== undefined) {
                fireObserversObject(this, afterObserversFromProp, value, 'update');
            }

            if (config.observers.after !== undefined) {
                for (n = 0, l = config.observers.after.length; n < l; n++) {
                    config.observers.after[n].call(this, prop, value, 'update');
                }
            }
        }
        /**
         * Set values to the object
         * @method setValues
         * @memberof fw/ObjectModel~ObjectModelClass
         * @inner
         * @param {Object} values - values we want to assign to the object
         */
        setValues(values) {
            var props = Object.keys(values);
            var j = props.length;
            var setFunctionsFromProp, beforeObserversFromProp, afterObserversFromProp, typeFromProp, optionsFromProp, validatorsFromProp, setObject, returnValue, prop, value, i, n, l;

            if (j > 0) {
                for (i = 0; i < j; i++) {
                    prop = props[i];
                    value = values[prop];
                    beforeObserversFromProp = utils.getValueFromObject(config.observers.props.before, prop);

                    if (config.observers.before !== undefined) {
                        for (n = 0, l = config.observers.before.length; n < l; n++) {
                            config.observers.before[n].call(this, prop, value, 'update');
                        }
                    }

                    if (beforeObserversFromProp !== undefined) {
                        fireObserversObject(this, beforeObserversFromProp, value, 'update');
                    }
                }

                for (i = 0; i < j; i++) {
                    prop = props[i];
                    value = values[prop];
                    setFunctionsFromProp = utils.getValueFromObject(config.set, prop);
                    typeFromProp = utils.getValueFromObject(config.types, prop);
                    optionsFromProp = utils.getValueFromObject(config.options, prop);
                    validatorsFromProp = utils.getValueFromObject(config.validators, prop);

                    if (setFunctionsFromProp !== undefined) {
                        setObject = fetchSetObject(this, setFunctionsFromProp, value, 'update');

                        if (types.isObject(setObject) && types.isObject(value)) {
                            utils.extendObject(true, value, setObject);
                        } else {
                            value = setObject;
                        }
                    }

                    if (typeFromProp !== undefined) {
                        returnValue = processPropValue(this, prop, typeFromProp, value, optionsFromProp);

                        if (returnValue !== undefined) {
                            value = returnValue;
                        }
                    }

                    utils.setValueToObject(this.object, prop, value);

                    if (processPropValidation(this, prop, value, validatorsFromProp)) {
                        fireObserversObject(this, utils.getValueFromObject(config.observers.props.validation, prop), value, 'update');
                    }
                }

                for (i = 0; i < j; i++) {
                    prop = props[i];
                    value = values[prop];
                    afterObserversFromProp = utils.getValueFromObject(config.observers.props.after, prop);

                    if (afterObserversFromProp !== undefined) {
                        fireObserversObject(this, afterObserversFromProp, value, 'update');
                    }

                    if (config.observers.after !== undefined) {
                        for (n = 0, l = config.observers.after.length; n < l; n++) {
                            config.observers.after[n].call(this, prop, value, 'update');
                        }
                    }
                }
            }
        }
        /**
         * Get error messages from a property
         * @method getErrorMessages
         * @memberof fw/ObjectModel~ObjectModelClass
         * @inner
         * @param {string} prop - property for which we want to retrieve the error messages
         * @return {Array}
         */
        getErrorMessages(prop) {
            var messages = [];
            var invalidField = this.invalidFields[prop];
            var key;

            if (invalidField) {
                for (key in invalidField) {
                    messages.push(invalidField[key]);
                }
            }

            return messages;
        }
        /**
         * Check the validity of the object
         * @method isValid
         * @memberof fw/ObjectModel~ObjectModelClass
         * @inner
         * @return {boolean}
         */
        isValid() {
            return types.isEmptyObject(this.invalidFields);
        }
        /**
         * Get the object model
         * @method getModel
         * @memberof fw/ObjectModel~ObjectModelClass
         * @inner
         * @return {fw/ObjectModel~ObjectModelClass}
         */
        getModel() {
            return config.model;
        }
        /**
         * Check if the object is empty
         * @method isEmpty
         * @memberof fw/ObjectModel~ObjectModelClass
         * @inner
         * @return {boolean}
         */
        isEmpty() {
            return types.isEmptyObject(this.object);
        }
        /**
         * Serialize the object to JSON
         * @method toJSON
         * @memberof fw/ObjectModel~ObjectModelClass
         * @inner
         * @return {Object}
         */
        toJSON() {
            return this.getObject();
        }
        /**
         * Merge objects
         * @method merge
         * @memberof fw/ObjectModel~ObjectModelClass
         * @inner
         */
        merge() {
            var l = arguments.length;
            var n, obj, key;

            for (n = 0; n < l; n++) {
                if (types.isObject(obj = arguments[n])) {
                    for (key in obj) {
                        this.set(key, obj[key]);
                    }
                }
            }
        }
        /**
         * Check equality with an object
         * @method equals
         * @memberof fw/ObjectModel~ObjectModelClass
         * @inner
         * @param {Object} object - object that will be checked for equality
         * @return {boolean}
         */
        equals(object) {
            return config.equals.call(this, object);
        }
    }

    return ObjectModelClass;
}
/**
 * Check if a class is an ObjectModelClass
 * @function
 * @param {function} clazz - class to be checked
 * @return {boolean}
 */
ObjectModel.isClass = function(clazz) {
    return types.isFunction(clazz) ? clazz.parent === ObjectModel : false;
};
/**
 * Check if a instance is an instance of ObjectModelClass
 * @function
 * @param {Object} instance - instance to be checked
 * @return {boolean}
 */
ObjectModel.isInstance = function(instance) {
    if (types.isNotNull(instance) && types.isFunction(instance.constructor)) {
        return instance.constructor.parent === ObjectModel;
    }

    return false;
};

module.exports = ObjectModel;
