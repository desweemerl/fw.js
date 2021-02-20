/**
 * @module fw/EventEmitter
 * @license MIT License
 * @author Ludovic Desweemer
 */
'use strict';

var ModuleError = require('./error/ModuleError');
var types = require('./types');

class EventEmitter {
    /**
     * @constructor
     */
    constructor() {
        this.listeners = {};
    }
    /**
     * Append a listener to the listeners for the specified event
     * @method on
     * @param {string} event - event to be registered
     * @param {function} listener - listener attached to the event
     * @param {boolean} [unsafe=false] - unsafe mode (don't check listener duplicates for performance gain)
     */
    on(event, listener, unsafe) {
        var self = this;

        function throwError(message) {
             throw new ModuleError({
                moduleName: self.constructor.message,
                message:    message,
                origin:     '"on" method'
            });
        }

        if (types.isEmptyString(event)) {
            throwError('event was not correctly defined');
        }

        if (!types.isFunction(listener)) {
            throwError('listener is not a function');
        }

        var listeners = this.listeners[event]  = this.listeners[event] || [];

        if (!unsafe && listeners.indexOf(listener) !== -1) {
            throwError('listener "' + listener.constructor.name + '" is already attached to this event emitter');
        }

        listeners.push(listener);
    }
    /**
     * Remove a listener from the event emitter
     * @method off
     * @param {string} event - event name
     * @param {function} [listener] - listener to be removed. If nothing is specified, remove all listeners.
     */
    off(event, listener) {
        var self = this;

        function throwError(message) {
            throw new ModuleError({
                moduleName: self.constructor.name,
                message:    message,
                origin:     '"off" method'
            });
        }

        if (types.isEmptyString(event)) {
            throwError('event was not correctly defined');
        }

        if (listener && !types.isFunction(listener)) {
            throwError('listener is not a function');
        }

        var listeners, index;

        if (!(listeners = this.listeners[event])) return;

        if (listener) {
            if ((index = listeners.indexOf(listener)) === -1) return;
            listeners.splice(index, 1);
        } else {
            this.listeners[event] = [];
        }
    }
    /**
     * Call all listeners attached to the specified event. Return true if listeners exists otherwise returns false.
     * @method emit
     * @param {string} event - event name
     * @param {*} [data] - data associated with the event 
     */
    emit(event, data) {
        if (types.isEmptyString(event)) {
            throw new ModuleError({
                moduleName: this.constructor.name,
                message:    'event was not correctly defined',
                origin:     '"emit" method'
            });
        }

        var listeners;
        var n, l;

        if (!(listeners = this.listeners[event])) return;

        for (n = 0, l = listeners.length; n < l; n++) {
            listeners[n](data);
        }
    }
}

module.exports = EventEmitter;
