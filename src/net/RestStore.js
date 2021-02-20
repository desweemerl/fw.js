/**
 * @module fw/net/RestStore
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var AjaxError = require('../error/AjaxError');
var DataSource = require('../source/DataSource');
var FwAjax = require('../net/Ajax');
var FwPromise = require('../Promise');
var types = require('../types');
var utils = require('../utils');

// Process before handler
function processBeforeHandler(promise, handler) {
    if (handler.done) {
        promise.then(handler.done);
    } else if (handler.fail) {
        promise.catch(handler.fail);
    }
}

// Process handler
function processHandler(promise, handler, type) {
    if (handler.type === undefined || handler.type === type) {
        if (handler.done) {
            promise.then(function (data) {
                var output = handler.done(data);

                return output === undefined ? data : output;
            });
        } else if (handler.fail) {
            promise.catch(function (error) {
                var output = handler.fail(error);

                if (output === undefined) {
                    throw error;
                }

                return output;
            });
        }
    }
}
// Process the request
function processRequest(self, type, options) {
    options = options || {};

    var url = self.url;
    var n = 0;
    var l = self.actions.length;
    var data, ajaxInstance, action, promise;

    // Remove all the actions completed or cancelled
    while (n < l) {
        action = self.actions[n];

        if (action.state > RestStore.STATE_IN_PROGRESS) {
            self.actions.splice(n, 1);
            l--;
        } else {
            n++;
        }
    }
    // For a GET or DELETE request, add the "id "
    if (type === 'GET' || type === 'DELETE') {
        // Check if options.id exists
        if (types.isString(options.id) || types.isValidNumber(options.id)) {
            url += '/' + options.id;
        }
    } else {
        // Merge data from the instance and the request
        data = utils.copyObject(
            self.data instanceof DataSource ? self.data.getObject() : self.data,
            options.data instanceof DataSource ? options.data.getObject() : options.data
        );
    }
    // Set the instance active
    self.active = true;
    // Create a starting promise
    promise = FwPromise.resolve();
    // Set the state of the promise in waiting
    promise.state = RestStore.STATE_WAITING;
    // Append with success and fail handlers before the ajax request
    for (n = 0, l = self.beforeHandlers.length; n < l; n++) {
        processBeforeHandler(promise, self.beforeHandlers[n]);
    }
    // Append with the ajax request
    promise = promise.then(function() {
        // Check if the promise is cancelled
        if (promise.state === RestStore.STATE_CANCELLED) {
            // If cancelled, throw an AjaxError
            throw new AjaxError({ status: AjaxError.REQUEST_ABORTED });
        }
        // Set the state of the promise in progress
        promise.state = RestStore.STATE_IN_PROGRESS;
        // Create an ajax request and register in the ajax requests store
        self.ajaxInstances.push(
            ajaxInstance = new FwAjax({
                url:      url,
                type:     type,
                timeout:  options.timeout || self.timeout,
                dataType: 'json',
                data:     data
            })
        );
        // Keep track of the ajax request
        promise.ajaxInstance = ajaxInstance;
        promise.xhr = ajaxInstance.xhr;

        return ajaxInstance.promise;
    }).then(
    // Return data when the ajax request is successful and remove the ajax request in the ajax requests store
    function(response) {
        var index = self.ajaxInstances.indexOf(ajaxInstance);

        if (index !== -1) {
            self.ajaxInstances.splice(index, 1);
        }
        // Deactivate the instance when no request is no longer in progress
        if (self.ajaxInstances.length === 0) {
            self.active = false;
        }
        // Set the state of the promise in success
        promise.state = RestStore.STATE_SUCCESSFUL;

        return response;
    },
    // Remove the ajax request in the ajax requests store and throw the error
    function(error) {
        var index = self.ajaxInstances.indexOf(ajaxInstance);

        if (index !== -1) {
            self.ajaxInstances.splice(index, 1);
        }
        // Deactivate the instance when no request is no longer in progress
        if (self.ajaxInstances.length === 0) {
            self.active = false;
        }
        // Set the state of the promise in cancel when the request is aborted
        if (error instanceof AjaxError) {
            if (error.status === AjaxError.REQUEST_ABORTED) {
                promise.state = RestStore.STATE_CANCELLED;
            }
        }
        // Set the state of the promise in error when the request is not cancelled
        if (promise.state !== RestStore.STATE_CANCELLED) {
            promise.state = RestStore.STATE_ERROR;
        }

        throw error;
    }
    );
    // Append with success and fail handlers
    for (n = 0, l = self.handlers.length; n < l; n++) {
        processHandler(promise, self.handlers[n], type);
    }

    return promise;
}

/**
 * Create an instance of fw/net/RestStore. This is a general purpose Source class.
 * @class
 * @alias module:fw/net/RestStore
 * @param {Object} config - the configuration object of the RestStore
 * @param {string} config.url - the URL of ajax request
 * @param {*} [config.data] - optional data sent in each ajax request
 * @param {string} [config.property] - property associated with the searchSource
 * @param {number} [config.timeout] - timeout of the request
 */
class RestStore {
    /**
     * @constructor
     */
    constructor(config) {
        this.config = config || {};
        this.data = this.config.data || null;
        this.timeout = this.config.timeout;
        this.url = this.config.url || '';
        this.active = false;
        this.ajaxInstances = [];
        this.actions = [];
        this.beforeHandlers = [];
        this.handlers = [];

        return this;
    }
    /**
     * Add a success callback handler before the ajax request is called
     * @method beforeDone
     * @param {string} type - type of the request ('GET', 'POST', 'PUT', 'DELETE')
     * @param {function} handler - the success callback handler called
     * @return {fw/net/RestStore}
     */
    beforeDone() {
        var handler, type;

        if (arguments.length === 1) {
            handler = arguments[0];
        } else if (arguments.length > 1) {
            type = arguments[0];
            handler = arguments[1];
        }
        // Register the handler
        if (types.isFunction(handler)) {
            this.beforeHandlers.push({ type: type, done: handler });
        }

        return this;
    }
    /**
     * Add a fail callback handler before the ajax request is called
     * @method beforeFail
     * @param {string} type - type of the request ('GET', 'POST', 'PUT', 'DELETE')
     * @param {function} handler - the success callback handler called
     * @return {fw/net/RestStore}
     */
    beforeFail() {
        var handler, type;

        if (arguments.length === 1) {
            handler = arguments[0];
        } else if (arguments.length > 1) {
            type = arguments[0];
            handler = arguments[1];
        }
        // Register the handler
        if (types.isFunction(handler)) {
            this.beforeHandlers.push({ type: type, fail: handler });
        }

        return this;
    }
    /**
     * Add a success callback handler after the ajax request is called
     * @method done
     * @param {string} type - type of the request ('GET', 'POST', 'PUT', 'DELETE')
     * @param {function} handler - the success callback handler called
     * @return {fw/net/RestStore}
     */
    done() {
        var handler, type;

        if (arguments.length === 1) {
            handler = arguments[0];
        } else if (arguments.length > 1) {
            type = arguments[0];
            handler = arguments[1];
        }
        // Register the handler
        if (types.isFunction(handler)) {
            this.handlers.push({ type: type, done: handler });
        }

        return this;
    }
    /**
     * Add a fail callback handler after the ajax request is called
     * @method fail
     * @param {string} type - type of the request ('GET', 'POST', 'PUT', 'DELETE')
     * @param {function} handler - the success callback handler called
     * @return {fw/net/RestStore}
     */
    fail() {
        var handler, type;

        if (arguments.length === 1) {
            handler = arguments[0];
        } else if (arguments.length > 1) {
            type = arguments[0];
            handler = arguments[1];
        }
        // Register the handler
        if (types.isFunction(handler)) {
            this.handlers.push({ type: type, fail: handler });
        }

        return this;
    }
    /**
     * Abort all the requests in progress
     * @method abort
     * @return {fw/net/RestStore}
     */
    abort() {
        var n, l, action;
        // Deactivate the RestStore
        this.active = false;
        // Abort all the ajax requests in progress
        while (this.ajaxInstances.length > 0) {
            this.ajaxInstances[0].abort();
            this.ajaxInstances.splice(0, 1);
        }
        // Cancel all the actions
        for (n = 0, l = this.actions.length; n < l; n++) {
            action = this.actions[n];
            if (action.state < RestStore.STATE_CANCELLED) {
                action.state = RestStore.STATE_CANCELLED;
            }
        }

        return this;
    }
    /**
     * Abort an action
     * @method abortAction
     * @param {fw/Promise} action - action registered in the RestStore instance
     * @return {fw/net/RestStore}
     */
    abortAction(action) {
        // Cancel the action if registered
        if (this.actions.indexOf(action) !== -1) {
            if (action.ajaxInstance) {
                action.ajaxInstance.abort();
            }

            if (action.state < RestStore.STATE_CANCELLED) {
                action.state = RestStore.STATE_CANCELLED;
            }
        }

        return this;
    }
    /**
     * Check if a request is active
     * @method isActive
     * @return {Boolean}
     */
    isActive() {
        return this.active;
    }
    /**
     * Send a 'GET' request
     * @method get
     * @param {Object} options - options associated with the request
     * @param {number|string} options.id - identifier
     * @return {fw/Promise}
     */
    get(options) {
        // Register the action
        var action = processRequest(this, 'GET', options);

        this.actions.push(action);

        return action;
    }
    /**
     * Send a 'POST' request
     * @method post
     * @param {Object} options - options associated with the request
     * @param {number|string} options.data - data sent in the request
     * @return {fw/Promise}
     */
    post(options) {
        var action = processRequest(this, 'POST', options);

        this.actions.push(action);

        return action;
    }
    /**
     * Send a 'PUT' request
     * @method put
     * @param {Object} options - options associated with the request
     * @param {number|string} options.data - data sent in the request
     * @return {fw/Promise}
     */
    put(options) {
        var action = processRequest(this, 'PUT', options);

        this.actions.push(action);

        return action;
    }
    /**
     * Send a 'DELETE' request
     * @method delete
     * @param {Object} options - options associated with the request
     * @param {number|string} options.id - identifier
     * @return {fw/Promise}
     */
    delete(options) {
        var action = processRequest(this, 'DELETE', options);

        this.actions.push(action);

        return action;
    }
}
// Define action states
Object.defineProperties(RestStore, {
    STATE_WAITING:     { value: 0 },
    STATE_IN_PROGRESS: { value: 1 },
    STATE_CANCELLED:   { value: 2 },
    STATE_SUCCESSFUL:  { value: 3 },
    STATE_ERROR:       { value: 4 }
});

module.exports = RestStore;
