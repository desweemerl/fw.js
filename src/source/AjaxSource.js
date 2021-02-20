/**
 * @module fw/source/AjaxSource
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var AjaxError = require('../error/AjaxError');
var DataSource = require('./DataSource');
var FwAjax = require('../net/Ajax');
var FwPromise = require('../Promise');
var NetSource = require('../source/NetSource');
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
function processHandler(promise, handler) {
    if (handler.done) {
        promise.then(function(data) {
            var output = handler.done(data);

            return output === undefined ? data : output;
        });
    } else if (handler.fail) {
        promise.catch (function(error) {
            var output = handler.fail(error);

            if (output === undefined) throw error;

            return output;
        });
    }
}

/**
 * @class
 * @alias module:fw/source/AjaxSource
 * @augments fw/source/NetSource
 * @param {Object} config - the configuration object parameter
 * @param {string} [config.url] - the URL endpoint
 * @param {number} [config.timeout] - timeout of the request
 */
class AjaxSource extends NetSource {
    /**
     * @constructor
     */
    constructor(config) {
        super(config);

        this.ajaxInstance = null;
    }
    /**
     * Abort the request
     * @method abort
     * @return {fw/source/AjaxSource}
     */
    abort() {
        this.active = false;

        if (this.ajaxInstance !== null) {
            this.ajaxInstance.abort();
        }

        return this;
    }
    /**
     * Set source to the AjaxSource
     * @method setSource
     * @param {data} data
     * @method {*} processed data
     */
    load(options) {
        options = options || {};

        var self = this;
        var promise, n, l;
        // Abort the request if exists
        this.abort();
        // Set the instance active
        this.active = true;
        // Create a starting promise
        promise = FwPromise.resolve();
        // Append with success and fail handlers before the ajax request
        for (n = 0, l = this.beforeHandlers.length; n < l; n++) {
            processBeforeHandler(promise, this.beforeHandlers[n]);
        }
        // Append with the ajax request
        promise = promise.then(function () {
            // Check if the AjaxSource is still active
            if (!self.active) {
                // If not active, throw an AjaxError
                throw new AjaxError({ status: AjaxError.REQUEST_ABORTED });
            }

            var parameters = utils.copyObject(
                self.parameters instanceof DataSource ? self.parameters.getObject() : self.parameters,
                options instanceof DataSource ? options.getObject() : options);

            // Create an ajax request
            self.ajaxInstance = new FwAjax({
                type:     'POST',
                dataType: 'json',
                url:      self.url,
                timeout:  self.timeout,
                data:     self.processParameters(parameters)
            });

            return self.ajaxInstance.promise;
        }).then(
            // Store data when ajax request is successful, hide spinners and deactivate the AjaxSource
            function(response) {
                self.active = false;
                self.ajaxInstance = null;

                return response;
            },
            // Deactivate the ChartSource and hide spinners
            function(error) {
                self.active = false;
                self.ajaxInstance = null;

                throw error;
            }
        );
        // Append with success and fail handlers
        for (n = 0, l = self.handlers.length; n < l; n++) {
            processHandler(promise, self.handlers[n]);
        }

        return promise;
    }
}

module.exports = AjaxSource;
