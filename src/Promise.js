/**
 * @module fw/Promise
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var ModuleError = require('./error/ModuleError');
var types = require('./types');

// Process handlers
function callHandlers(self) {
    var n, l;

    for (n = 0, l = self.handlers.length; n < l; n++) {
        var handler = self.handlers[n];
        var func;

        if (self.status === 'resolved') {
            func = handler.onFulfilled;
        } else if (self.status === 'rejected') {
            func = handler.onRejected;
        }

        if (types.isFunction(func)) {
            try {
                self.value = func(self.value);
                self.status = 'resolved';
            } catch (ex) {
                self.value = ex;
                self.status = 'rejected';
            }
        }

        if (self.value instanceof FwPromise) {
            if (types.isFunction(handler.nextResolve)) {
                self.value.then(handler.nextResolve);
            }

            if (types.isFunction(handler.nextReject)) {
                self.value.catch(handler.nextReject);
            }

            break;
        } else {
            if (self.status === 'resolved' && types.isFunction(handler.nextResolve)) {
                handler.nextResolve(self.value);
            } else if (self.status === 'rejected' && types.isFunction(handler.nextReject)) {
                handler.nextReject(self.value);
            }
        }
    }
}

/**
 * Create a promise
 * @class
 * @alias module:fw/Promise
 * @param {function} resolver - function(resolve, reject)
 */
class FwPromise {
    /**
     * @constructor
     */
    constructor(resolver) {
        var self = this;

        if (!types.isFunction(resolver)) {
            throw new ModuleError({
                moduleName: 'fw/Promise',
                message:    'Promise resolver is not defined',
                origin:     'constructor'
            });
        }

        this.status = 'pending';
        this.value = undefined;
        this.handlers = [];

        function callFulfillmentdHandler(value) {
            window.setTimeout(function() {
                if (self.status === 'pending') {
                    self.value = value;
                    self.status = 'resolved';
                    callHandlers(self);
                }
            }, 0);
        }

        function callRejectionHandler(error) {
            window.setTimeout(function () {
                if (self.status === 'pending') {
                    self.value = error;
                    self.status = 'rejected';
                    callHandlers(self);
                }
            }, 0);
        }

        try {
            resolver(callFulfillmentdHandler, callRejectionHandler);
        } catch (ex) {
            callRejectionHandler(ex);
        }

        return this;
    }
    /**
     * Appends fulfillment and rejection handlers to the promise, and returns a new promise resolving to the return value of the called handler
     * @method then
     * @param {function} onFulfilled - function(value) fulfillement handler
     * @param {function} onRejected - function(value) rejection handler
     * @return fw/Promise
     */
    then(onFulfilled, onRejected) {
        var self = this;

        return new FwPromise(function(resolve, reject) {
            var handler = {
                nextResolve: resolve,
                nextReject: reject
            };

            if (types.isFunction(onFulfilled)) {
                handler.onFulfilled = function() {
                    return onFulfilled(self.value);
                };
            }

            if (types.isFunction(onRejected)) {
                handler.onRejected = function() {
                    return onRejected(self.value);
                };
            }

            self.handlers.push(handler);
        });
    }
    /**
     * Appends a rejection handler callback to the promise, and returns a new promise resolving to the return value of the callback if it is called, or to its original fulfillment value if the promise is instead fulfilled.
     * @method catch
     * @param {function} onRejected - function(value) rejection handler
     * @return fw/Promise
     */
    catch(onRejected) {
        return this.then(undefined, onRejected);
    }
    /**
     * Create a promise that resolves when all of the promises in the iterable argument have resolved
     * @method all
     * @static
     * @param {Array} iterable - array of promises
     * @return fw/Promise
     */
    static all(iterable) {
        if (!(iterable instanceof Array)) {
            throw new ModuleError({
                moduleName: 'fw/Promise',
                message:    'argument is not an array',
                origin:     '"FwPromise.all" static method'
            });
        } else if (iterable.length === 0) {
            return new FwPromise(function(resolve, reject) { resolve(); });
        }

        return new FwPromise(function(resolve, reject) {
            var countResolvedPromise = 0;
            var rejected = false;
            var promises = [];
            var output = [];
            var value, promise;
            var i, n, l;

            function resolvePromiseHandler() {
                if (rejected) return;

                countResolvedPromise++;

                if (countResolvedPromise === l) {
                    for (i = 0; i < l; i++) {
                        output.push(promises[i].value);
                    }

                    resolve(output);
                }
            }

            function resolveValue(value) {
                return function(resolve) {
                    resolve(value);
                };
            }

            function rejectError(error) {
                rejected = true;
                reject(error);
            }

            for (n = 0, l = iterable.length; n < l; n++) {
                value = iterable[n];

                if (value instanceof FwPromise) {
                    promises.push(promise = value);
                    promise.catch(rejectError).then(resolvePromiseHandler);
                } else {
                    promises.push(promise = new FwPromise(resolveValue(value)));
                    promise.catch(rejectError).then(resolvePromiseHandler);
                }
            }
        });
    }
    /**
     * Returns a promise that resolves or rejects as soon as one of the promises in the iterable resolves or rejects, with the value or reason from that promise.
     * @method race
     * @static
     * @param {Array} iterable - array of promises
     * @return fw/Promise
     */
    static race(iterable) {
        if (!(iterable instanceof Array)) {
            throw new ModuleError({
                moduleName: 'fw/Promise',
                message:    'argument is not an array',
                origin:     '"FwPromise.race" static method'
            });
        } else if (iterable.length === 0) {
            return new FwPromise(function(resolve, reject) { resolve(); });
        }

        function resolveValue(value) {
            return function(resolve) {
                resolve(value);
            };
        }       

        return new FwPromise(function(resolve, reject) {
            var n, l, value, promise;

            for (n = 0, l = iterable.length; n < l; n++) {
                value = iterable[n];
                promise = value instanceof FwPromise ? value : new FwPromise(resolveValue(value));
                promise.catch(reject).then(resolve);
            }
        });
    }   
    /**
     * Returns a promise that is resolved with the given value
     * @method resolve
     * @static
     * @param {*} value
     * @return fw/Promise
     */
    static resolve(data) {
        return new FwPromise(function(resolve, reject) { resolve(data); });
    }   
    /**
     * Returns a promise that is rejected with the given error
     * @method reject
     * @static
     * @param {*} error
     * @returns fw/Promise
     */
    static reject(error) {
        return new FwPromise(function(resolve, reject) { reject(error); });
    }   
}

module.exports = FwPromise;
