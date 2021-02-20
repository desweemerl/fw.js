/**
 * @module fw/source/NetSource
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var Source = require('../source/Source');
var SourceError = require('../error/SourceError');
var types = require('../types');
var utils = require('../utils');

/**
 * @class
 * @alias module:fw/source/NetSource
 * @augments fw/source/Source
 * @param {Object} config - the configuration object parameter
 * @param {Object} [config.parameters] - the 
 * @param {string} [config.url] - the URL endpoint
 * @param {number} [config.timeout] - timeout of the request
 */
class NetSource extends Source {
    /**
     * @constructor
     */
    constructor(config) {
        super(config);

        this.parameters = this.config.parameters || {};
        this.url = this.config.url || null;
        this.timeout = this.config.timeout || {};
        this.active = false;
        this.beforeHandlers = [];
        this.handlers = [];
    }
    /**
     * Remove handler
     * @method removeHandler
     * @param {string} handlerType - handler type ('beforeDone', 'done', 'beforeFail', 'fail')
     * @param {function} handler - handler to be removed
     * @return {boolean} handlerRemoved
     */
    removeHandler(handlerType, handler) {
        var self = this;

        function removeFromHandlers(handlers, type) {
            var handlerRemoved = false;
            var n, l;

            for (n = 0, l = handlers.length; n < l; n++) {
                if (self.handlers[n][type] === handler) {
                    self.handlers.splice(n, 1);
                    handlerRemoved = true;
                    n--;
                    l--;
                }
            }

            return handlerRemoved;
        }

        switch (handlerType) {
            case 'beforeDone':
                return removeFromHandlers(this.beforeHandlers, 'done');
            case 'beforeFail':
                return removeFromHandlers(this.beforeHandlers, 'fail');
            case 'done':
                return removeFromHandlers(this.handlers, 'done');
            case 'fail':
                return removeFromHandlers(this.handlers, 'fail');
        }

        return false;
    }
    /**
     * Add a success callback handler before the request is called
     * @method beforeDone
     * @param {function} handler - the success callback handler called
     * @return {fw/source/NetSource}
     */
    beforeDone(handler) {
        // Register the handler
        if (types.isFunction(handler)) {
            this.beforeHandlers.push({ done: handler });
        }

        return this;
    }
    /**
     * Add a fail callback handler before the request is called
     * @method beforeFail
     * @param {function} handler - the fail callback handler called
     * @return {fw/source/NetSource}
     */
    beforeFail(handler) {
        // Register the handler
        if (types.isFunction(handler)) {
            this.beforeHandlers.push({ fail: handler });
        }

        return this;
    }
    /**
     * Add a success callback handler after the request is called
     * @method done
     * @param {function} handler - the success callback handler called
     * @return {fw/source/NetSource}
     */
    done(handler) {
        // Register the handler
        if (types.isFunction(handler)) {
            this.handlers.push({ done: handler });
        }

        return this;
    }
    /**
     * Add a fail callback handler after the ajax request is called
     * @method fail
     * @param {function} handler - the fail callback handler called
     * @return {fw/source/NetSource}
     */
    fail(handler) {
        // Register the handler
        if (types.isFunction(handler)) {
            this.handlers.push({ fail: handler });
        }

        return this;
    }
    /**
     * Abort the request
     * @method abort
     * @abstract
     */
    abort() {
        throw new SourceError({
            sourceName: 'NetSource',
            message:    'abort method must be implemented',
            origin:     'abort method'
        });
    }
    /**
     * Check if a request is active
     * @method isActive
     * @return {boolean}
     */
    isActive() {
        return this.active;
    }
    /**
     * Process parameters before sending the request
     * @method processParameters
     * @param {Object} parameters
     * @return {Object} processed parameters
     */
    processParameters(parameters) { return parameters; }
}

module.exports = NetSource;
