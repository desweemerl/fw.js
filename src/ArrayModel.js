/**
 * @module fw/ArrayModel
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var ObjectModel = require('./ObjectModel');
var types = require('./types');
var utils = require('./utils');

var id = { name: 'ArrayModelClass' };

/**
 * The fw/ArrayModel function brings types checking, observers and validators to Javascript Arrays
 * @function
 * @alias module:fw/ArrayModel
 * @param {Object} options - ArrayModel options
 * @param {function} [options.observer.init] - equivalent to observers.after.init option
 * @param {function} [options.observer.before.init] - function(item, flag) observer triggered before that a new array is defined
 * @param {function} [options.observer.after.init] - function(item, flag) observer triggered after that a new array is defined
 * @param {function} [options.observer.add] - equivalent to observers.after.add option
 * @param {function} [options.observer.before.add] - function(item, flag) observer triggered before that an item is added to the array
 * @param {function} [options.observer.after.add] - function(item, flag) observer triggered after that an item is added to the array
 * @param {function} [options.observer.update] - equivalent to observers.after.update option
 * @param {function} [options.observer.before.update] - function(item, flag) observer triggered before that an item is updated in the array
 * @param {function} [options.observer.after.update] - function(item, flag) observer triggered after that an item is updated in the array
 * @param {function} [options.observer.remove] - equivalent to observers.after.remove option
 * @param {function} [options.observer.before.remove] - function(item, flag) observer triggered before that an item is removed from the array
 * @param {function} [options.observer.after.remove] - function(item, flag) observer triggered after that an item is removed from the array
 * @param {fw/ObjectModel~ObjectModelClass} [options.model] - object model of the array items
 * @return {fw/ArrayModel~ArrayModelClass}
 */
function ArrayModel(options, arrayModelClass) {
    // Define options
    options = options || {};
    // Check objectModelClass existence for inheritance
    var config = arrayModelClass && arrayModelClass.id === id ? arrayModelClass.config : {};
    // Setup config
    config = utils.copyObject(config);
    config.observers = config.observers || {};
    config.observers.add = config.observers.add || {};
    config.observers.update = config.observers.update || {};
    config.observers.remove = config.observers.remove || {};
    config.observers.init = config.observers.init || {};
    config.model = config.model || null;
    // Check if the model is defined
    if (ObjectModel.isClass(options.model)) {
        config.model = options.model;
    }
    // If model is an object, create an fw/ObjectModel class with model as configuration
    else if (types.isObject(options.model)) {
        config.model = ObjectModel(options.model); // jshint ignore:line 
    // Create an empty fw/ObjectModel class if model is not defined
    } else if (config.model === null) {
        config.model = ObjectModel(); // jshint ignore:line 
    }
    // Add observers to the fw/ArrayModel class
    options.observer = options.observer || {};
    options.observer.add = options.observer.add || {};
    options.observer.update = options.observer.update || {};
    options.observer.remove = options.observer.remove || {};
    addObservers(config.observers, 'add', options.observer.add);
    addObservers(config.observers, 'update', options.observer.update);
    addObservers(config.observers, 'remove', options.observer.remove);
    addObservers(config.observers, 'init', options.observer.init);
    // Check observer duplicate and add observer
    function addObserver(object, observer, action, type) {
        var target;

        type = type || 'after';
        object[action] = object[action] || {};
        target = object[action][type];
       
        if (target) {
            if (target.indexOf(observer) !== -1) {
                throw new ModelError({
                    modelName: 'fw/ArrayModel',
                    message:   type + ' observer "' + observer.constructor.name + ' for action' + action + 'is already registered',
                    origin:    '"addObserver" function'
                });
            }

            target.push(observer);
        } else {
            object[action][type] = [observer];
        }
    }
    // Add observers to the class 
    function addObservers(object, action, obs) {
        if (types.isFunction(obs)) {
            addObserver(object, obs, action);
        } else if (types.isObject(obs)) {
            if (types.isFunction(obs.before)) {
                addObserver(object, obs.before, action, 'before');
            }

            if (types.isFunction(obs.after)) {
                addObserver(object, obs.after, action);
            }
        }
    }
    /**
     * The ArrayModalClass is only created with the fw/ArrayModel function.
     * @class fw/ArrayModel~ArrayModelClass
     * {@link fw/ArrayModel}
     * @param {Object[]} array - items array or ObjectModel instances array
     */
    class ArrayModelClass {
        /**
         * @constructor
         */
        constructor(array) {
            this.setArray(array);
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
            return ArrayModel;
        }
        /**
         * define config
         * @property config
         */
        static get config() {
            return config;
        }
        /**
         * Get the object model
         * @method fw/ArrayModel~ArrayModelClass.getModel
         * @static
         * @return {fw/ObjectModel~ArrayModelClass}
         */
        static getModel() {
            return config.model;
        }
        /**
         * Add observer to the ArrayModelClass
         * @method fw/ArrayModel~ArrayModelClass.addObserver
         * @static
         * @param {string} action - action for which we attach an observer ("add", "update", "remove", "init")
         * @param {string} obsType - observer type ("before", "after")
         * @param {function} observer - function(item, flag) observer function, where flag can be "init", "add", "clean" or "remove"
         * @return {fw/ArrayModel~ArrayModelClass}
         */
        static addObserver(action, obsType, observer) {
            if (types.isFunction(observer) && 
                types.inArray(action, ['add', 'update', 'remove', 'init'] && 
                types.inArray(obsType, ['before', 'after']))) {
                addObserver(config.observers, observer, action, obsType); 
            }

            return this;
        }       
        /**
         * Remove observer from the ArrayModelClass
         * @method fw/ArrayModel~ArrayModelClass.removeObserver
         * @static
         * @param {string} action - action for which we want to remove an observer ("add", "update", "remove", "init")
         * @param {string} obsType - observer type ("before", "after")
         * @param {function} observer 
         * @return {fw/ArrayModel~ArrayModelClass}
         */
        static removeObserver(action, obsType, observer) {
            var index;

            if (types.isFunction(observer) && 
                types.inArray(action, ['add', 'update', 'remove', 'init']) && 
                types.inArray(obsType, ['before', 'after']) &&
                config.observers[action]) {

                if (config.observers[action][obsType]) {
                    index = config.observers[action][obsType].indexOf(observer);

                    if (index !== -1) {
                        config.observers[action].before.splice(index, 1);
                    }
                } 
            }

            return this;
        }       
        /**
         * Store a new array
         * @method setArray
         * @memberof fw/ArrayModel~ArrayModelClass
         * @inner
         * @param {Object[]} array - items array or ObjectModel instances array
         */
        setArray(array) {
            var self = this;
            var item, i, j, n, l;

            if (!(array instanceof Array)) {
                array = [];
            }

            this.array = [];
            // Trigger "init before" observers
            if (config.observers.init.before !== undefined) {
                for (n = 0, l = config.observers.init.before.length; n < l; n++) {
                    config.observers.init.before[n].call(self, array);
                }
            }

            for (i = 0, j = array.length; i < j; i++) {
                item = array[i];
                // Instantiate an item from ObjectModel
                if (!(item instanceof config.model)) {
                    item = new config.model(item);
                }
                // Trigger "add before" observers
                if (config.observers.add.before !== undefined) {
                    for (n = 0, l = config.observers.add.before.length; n < l; n++) {
                        config.observers.add.before[n].call(self, item, 'init');
                    }
                }
                // Add the item to the array
                this.array.push(item);
                // Trigger "add after" observers
                if (config.observers.add.after !== undefined) {
                    for (n = 0, l = config.observers.add.after.length; n < l; n++) {
                        config.observers.add.after[n].call(self, item, 'init');
                    }
                }
            }
            // Trigger "init after" observers
            if (config.observers.init.after !== undefined) {
                for (n = 0, l = config.observers.init.after.length; n < l; n++) {
                    config.observers.init.after[n].call(self, array);
                }
            }
        }
        /**
         * Remove all items from the array
         * @method clear
         * @memberof fw/ArrayModel~ArrayModelClass
         * @inner
         */
        clear() {
            var self = this;
            var item, n, l;

            while (this.array.length > 0) {
                // Get the item at the specified index
                item = this.array[0];
                // Trigger "remove before" observers
                if (config.observers.remove.before !== undefined) {
                    for (n = 0, l = config.observers.remove.before.length; n < l; n++) {
                        config.observers.remove.before[n].call(self, item, 'clear');
                    }
                }
                // Remove the index from array
                this.array.splice(0, 1);
                // Trigger "remove after" observers
                if (config.observers.remove.after !== undefined) {
                    for (n = 0, l = config.observers.remove.after.length; n < l; n++) {
                        config.observers.remove.after[n].call(self, item, 'clear');
                    }
                }
            }
        }
        /**
         * Iterate all items
         * @method forEach
         * @memberof fw/ArrayModel~ArrayModelClass
         * @inner
         * @param {function} cb - function(itemIndex, item) callback function, where iteration stops when returning false value
         */
        forEach(cb) {
            var n, l, obj;

            if (types.isFunction(cb)) {
               for (n = 0, l = this.array.length; n < l; n++) {
                  obj = this.array[n];
                  if (obj === undefined || cb.call(this, n, obj) === false) break;
               }
            }
        }
        /**
         * Get array size
         * @method getSize
         * @memberof fw/ArrayModel~ArrayModelClass
         * @inner
         * @return {number}
         */
        getSize() {
            return this.array.length;
        }
        /**
         * Get the array
         * @method getArray
         * @memberof fw/ArrayModel~ArrayModelClass
         * @inner
         * @return {Array}
         */
        getArray() {
            return this.array;
        }
        /**
         * Get the index of an item in the array
         * @method indexOf
         * @memberof fw/ArrayModel~ArrayModelClass
         * @inner
         * @param {Object} item - item for which we want to retrieve the index in the array
         * @return {number}
         */
        indexOf(item) {
            var n, l;

            if (!(item instanceof config.model)) {
                item = new config.model(item);
            }

            for (n = 0, l = this.array.length; n < l; n++) {
                if (this.array[n].equals(item)) {
                    return n;
                }
            }

            return -1;
        }
        /**
         * Check the validity of all items in the array
         * @method isValid
         * @memberof fw/ArrayModel~ArrayModelClass
         * @inner
         * @return {boolean}
         */
        isValid() {
            var isValid = true;
            var n, l;

            for (n = 0, l = this.array.length; n < l; n++) {
                if (!this.array[n].isValid()) {
                    isValid = false;
                    break;
                }
            }

            return isValid;
        }
        /**
         * Get the item at the specified index
         * @method get
         * @memberof fw/ArrayModel~ArrayModelClass
         * @inner
         * @return {Object}
         */
        get(index) {
            return this.array[index];
        }
        /**
         * Get an array slice
         * @method getSlice
         * @memberof fw/ArrayModel~ArrayModelClass
         * @inner
         * @param {number} start - first index of the selection
         * @param {number} end - last index of the selection
         * @return {Array}
         */
        getSlice(start, end) {
            return this.array.slice(start, end);
        }
        /**
         * Add an item to the array
         * @method add
         * @memberof fw/ArrayModel~ArrayModelClass
         * @inner
         * @param {Object} item - item to be added to the array
         */
        add(item) {
            var self = this;
            var n, l;
            // Instantiate an item from ObjectModel
            if (!(item instanceof config.model)) {
                item = new config.model(item);
            }
            // Trigger "add before" observers
            if (config.observers.add.before !== undefined) {
                for (n = 0, l = config.observers.add.before.length; n < l; n++) {
                    config.observers.add.before[n].call(self, item, 'add');
                }
            }
            // Add the item to the array
            this.array.push(item);
            // Trigger "add after" observers
            if (config.observers.add.after !== undefined) {
                for (n = 0, l = config.observers.add.after.length; n < l; n++) {
                    config.observers.add.after[n].call(self, item, 'add');
                }
            }
        }
        /**
         * Replace an item in the array at a specified index
         * @method set
         * @memberof fw/ArrayModel~ArrayModelClass
         * @inner
         * @param {number} index - index where the item will be replaced
         * @param {Object} item - the new item that will be insered in the array
         * @return {boolean} return true if the item at the specified index was replaced
         */
        set(index, item) {
            var self = this;
            var n, l;
            // Return false if the index doesn't exist
            if (this.array[index] === undefined) {
                return false;
            }
            // Instantiate an item from ObjectModel
            if (!(item instanceof config.model)) {
                item = new config.model(item);
            }
            // Trigger "update before" observers
            if (config.observers.update.before !== undefined) {
                for (n = 0, l = config.observers.update.before.length; n < l; n++) {
                    config.observers.update.before[n].call(self, item);
                }
            }
            // Add the item to the array
            this.array[index] = item;
            // Trigger "update after" observers
            if (config.observers.update.after !== undefined) {
                for (n = 0, l = config.observers.update.after.length; n < l; n++) {
                    config.observers.update.after[n].call(self, item);
                }
            }

            return true;
        }
        /**
         * Remove an item from the array at a specified index
         * @method set
         * @memberof fw/ArrayModel~ArrayModelClass
         * @inner
         * @param {number} index - index where the item will be replaced
         * @param {Object} item - the new item that will be insered in the array
         * @return {boolean} return true if the item at the specified index was removed
         */
        remove(index) {
            var self = this;
            var item, n, l;
            // Return false if the index doesn't exist
            if (this.array[index] === undefined) return false;
            // Get the item at the specified index
            item = this.array[index];
            // Trigger "remove before" observers
            if (config.observers.remove.before !== undefined) {
                for (n = 0, l = config.observers.remove.before.length; n < l; n++) {
                    config.observers.remove.before[n].call(self, item, 'remove');
                }
            }
            // Remove the index from array
            this.array.splice(index, 1);
            // Trigger "remove after" observers
            if (config.observers.remove.after !== undefined) {
                for (n = 0, l = config.observers.remove.after.length; n < l; n++) {
                    config.observers.remove.after[n].call(self, item, 'remove');
                }
            }

            return true;
        }
        /**
         * Serialize the array to JSON
         * @method toJSON
         * @memberof fw/ArrayModel~ArrayModelClass
         * @inner
         * @return {Array}
         */
        toJSON() {
            return this.array;
        }
    }

    return ArrayModelClass;
}
/**
 * Check if a class is an ArrayModelClass
 * @function
 * @param {function} clazz - class to be checked
 * @return {boolean}
 */
ArrayModel.isClass = function(clazz) {
    return types.isFunction(clazz) ? clazz.parent === ArrayModel : false;
};
/**
 * Check if a instance is an instance of ArrayModelClass
 * @function
 * @param {Object} instance - instance to be checked
 * @return {boolean}
 */
ArrayModel.isInstance = function(instance) {
    if (types.isNotNull(instance) && types.isFunction(instance.constructor)) {
        return instance.constructor.parent === ArrayModel;
    }

    return false;
};

module.exports = ArrayModel;
