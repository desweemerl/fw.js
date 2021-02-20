/**
 * @module fw/Model
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var Application = require('./Application');
var FwAjax = require('./net/Ajax');
var FwPromise = require('./Promise');
var Loader = require('./net/Loader');
var ModuleError = require('./error/ModuleError');
var NetSource = require('./source/NetSource');
var types = require('./types'); 

/**
 * Create an instance of fw/Model linked to the fw/Application.
 * Services are registered in fw/Application and can be called in the fw/Model instance.
 * When a network request succeed or failed, the netDone or the netFail functions are called in the fw/Application.
 * @abstract
 * @class
 * @alias module:fw/Model
 * @param {Object} [config] - the configuration object parameter
 */
class Model {
    /**
     * Load controller
     * @method load
     * @static
     * @abstract
     * @return {fw/Promise}
     */
    static load() {
        var classLoaders = this.loaders;
        var loaders = [];
        var n, l, loader;

        if (classLoaders instanceof Array) {
            for (n = 0, l = classLoaders.length; n < l; n++) {
                loader = classLoaders[n];

                if (loader instanceof FwPromise) {
                    loaders.push(loader);
                }
            }
        }

        return FwPromise.all(loaders);
    }
    /**
     *
     */
    static ajax(options) {
        options = options || {};
        options.url = Application.createURL(options.serviceName, options.url);
        options.timeout = Application.netTimeout || options.timeout;       

        return new FwAjax(options);
    }
    /**
     *
     */ 
    static loadJson(options) {
        options = options || {};
        options.url = Application.createURL(options.serviceName, options.url);
        options.timeout = Application.netTimeout || options.timeout;       

        return Loader.loadJson(options);
    }

    static getJson(options) {
        options = options || {};
        options.url = Application.createURL(options.serviceName, options.url);

        return Loader.loadJson(options.url);
    }   
    /**
     * @constructor
     */
    constructor(config) {
        this.config = config || {};
        // Initialize ajax requests store
        this.ajaxInstances = [];
        // Initialize network objects store
        this.netProviderInstances = [];
        // Call the initialize function
        this.initialize();
    }
    /**
     * Called when the model is instantiated
     * @abstract
     * @method initialize
     * @param {Object} config - the configuration object parameter
     */
    initialize() {}
    /**
     * Abort all network requests
     * @method abortAll
     */
    abortAll() {
        var n, l;

        // Abort all ajax requests
        for (n = 0, l = this.ajaxInstances.length; n < l; n++) {
            this.ajaxInstances[n].abort();
        }

        // Abort and remove all network requests
        while (this.netProviderInstances.length > 0) {
            this.netProviderInstances[0].abort();
            this.netProviderInstances.splice(0, 1);
        }
    }
    /**
     * Check if a netowork request or a source object is active
     * @method isActive
     * @return {boolean}
     */
    isActive() {
        var n, l;
        // Check if a source object is active
        for (n = 0, l = this.netProviderInstances.length; n < l; n++) {
            if (this.netProviderInstances[n].isActive()) {
                return true;
            }
        }
        // Check if the ajax requests store contains object
        return this.ajaxInstances.length > 0;
    }
    /**
     * Create an NetProvider instance
     * @method createNetProviderInstance
     * @param {function} NetProvider - class representing a net implementation (NetSource, RestStore, ...)
     * @param {Object} config - the configuration object of the NetSource
     * @param {string} config.url - the URL or the suffix of the URL if a service name is specified
     * @param {string} [config.serviceName] - the name of the service registered in the application
     * @param {Object} [config.parameters] - optional parameters sent in each network request
     * @param {number} [config.timeout] - timeout of the request. fw/Application.netTimeout is used by default
     * @return {Object}
     */
    createNetProviderInstance(NetProvider, config) {
        var self = this;
        var netProviderInstance;

        function throwError(message) {
            throw new ModuleError({
                moduleName: self.constructor.name,
                message:    message,
                origin:     '"createNetProviderInstance" method'
            });
        }

        if (!types.isFunction(NetProvider)) {
            throwError('NetProvider must be a class');
        }

        if (!types.isFunction(NetProvider.prototype.beforeDone)) {
            throwError('"' + NetProvider.name + '" must implement "beforeDone" method');
        }

        if (!types.isFunction(NetProvider.prototype.beforeFail)) {
            throwError('"' + NetProvider.name + '" must implement "beforeFail" method');
        }

        if (!types.isFunction(NetProvider.prototype.done)) {
            throwError('"' + NetProvider.name + '" must implement "done" method');
        }

        if (!types.isFunction(NetProvider.prototype.fail)) {
            throwError('"' + NetProvider.name + '" must implement "fail" method');
        }

        if (!types.isFunction(NetProvider.prototype.abort)) {
            throwError('"' + NetProvider.name + '" must implement "abort" method');
        }

        if (!types.isFunction(NetProvider.prototype.isActive)) {
            throwError('"' + NetProvider.name + '" must implement "isActive" method');
        }

        config = config || {};
        config.url = Application.createURL(config.serviceName, config.url);
        config.timeout = Application.netTimeout || config.timeout;

        this.netProviderInstances.push(netProviderInstance = new NetProvider(config).beforeDone(function () {
            Application.netBeforeSend();
        }).done(function (response) {
            Application.netDone(response);
        }).fail(function (error) {
            Application.netFail(error);
        }));

        return netProviderInstance;
    }
    /**
     * Create and register an ajax request
     * @method ajax
     * @param {Object} options - options of the ajax request
     * @param {string} options.url - the URL or the suffix of the URL if a service name is specified
     * @param {string} [options.serviceName] - the name of the service registered in the application
     * @param {number} [options.timeout] - timeout of the request. fw/Application.netTimeout is used by default
     * @return {fw/net/Ajax}
     */
    ajax(options) {
        var self = this;
        var ajax;

        options = options || {};
        options.url = Application.createURL(options.serviceName, options.url);
        options.timeout = Application.netTimeout || options.timeout;
        // Call Application.netBeforeSend before sending request
        Application.netBeforeSend();
        // Register the ajax in the ajax requests store
        this.ajaxInstances.push(ajax = new FwAjax(options));
        ajax.then(
            // Remove ajax request from ajax requests store and return data
            function (response) {
                var index = self.ajaxInstances.indexOf(ajax);

                if (index !== -1) {
                    self.ajaxInstances.splice(index, 1);
                }
                // Call Application.netDone with data and model state
                Application.netDone(response);
            },
            // Remove ajax request from ajax requests store and throw error
            function (error) {
                var index = self.ajaxInstances.indexOf(ajax);

                if (index !== -1) {
                    self.ajaxInstances.splice(index, 1);
                }
                // Call Application.netFail with error and model state
                Application.netFail(error);
            }
        );

        return ajax;
    }
}

module.exports = Model;
