/**
 * @module fw/Application
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var FwPromise = require('./Promise');
var ModuleError = require('./error/ModuleError');
var initialize = require('./initialize');
var types = require('./types');

/**
 * Store all services URLs
 * @private
 */
var serviceURLs = {};
/**
 * @export fw/Application
 */
var Application = {
    /**
     * Create an application
     * @method create
     * @param {Object} impl - the application implementation
     * @return {Object} implemented application
     */
    create: function(impl) {
        impl = impl || {};

        var self = this;
        var key;
        
        for (key in impl) {
            self[key] = impl[key];
        }

        this.load()
            .catch(function(error) {
                console.log('Application error:' + error);
            }).then(function() {
                return self.initialize();
            });

        return this;
    },
    /**
     * Initialize the application
     * @abstract
     * @method initialize
     * @param {Object} config - the configuration object parameter
     */
    initialize: function(config) {},
    /**
     * Load application
     * @abstract
     * @method load
     * @return {fw/Promise}
     */ 
    load: function() {
        return FwPromise.resolve();
    },
    /**
     * Associate a base URL to a service
     * @method addServiceURL0
     * @static
     * @param {string} [serviceName] - the name of the service. If not defined, the service base URL is global.
     * @param {string} url - the base URL of the service
     * @example
     * Application.addService('service.myURL.com');
     * Application.addService('testService', 'testService.myUrl.com');
     */
    addServiceURL: function() {
        var serviceName = '';
        var url;

        if (arguments.length === 1) {
            url = arguments[0];
        } else if (arguments.length > 1) {
            serviceName = arguments[0];
            url = arguments[1];
        }

        if (!types.isString(url)) return;

        url = url.trim().replace(/\/+$/g, '') + '/';

        if (types.isString(serviceName)) {
            serviceURLs[serviceName] = url;
        }
    },
    /**
     * Associate base URLs to services
     * @method addServicesURL
     * @static
     * @param {Object[]} servicesURL - services names and base URLS
     * @param {string} [servicesURL[].name] - the name of the service. If not defined, the service base URL is global.
     * @param {string} servicesURL[].url - the base URL of the service
     * @example
     * Application.addServices(['service.myURL.com', {name: 'testService', url: 'testService.myUrl.com'}]);
     */
    addServicesURL: function(servicesURL) {
        var n, l, item;

        if (servicesURL instanceof Array) {
            for (n = 0, l = servicesURL.length; n < l; n++) {
                item = servicesURL[n];

                if (types.isString(item)) {
                    this.addServiceURL(item);
                } else if (types.isObject(item)) {
                    this.addServiceURL(item.name || '', item.url);
                }
            }
        }
    },
    /**
     * Create a complete URL from registered service URL
     * @method createURL
     * @static
     * @param {string} [serviceName] - the name of the registered service. If not defined, the service is global.
     * @param {string} urlSuffix - the suffix of the URL
     * @returns {string} the complete URL
     * @example
     * Application.createURL('testService', 'store')
     */
    createURL: function() {
        var serviceName = '';
        var serviceURL, urlSuffix;

        if (arguments.length === 1) {
            urlSuffix = arguments[0];
        } else if (arguments.length === 2) {
            serviceName = arguments[0] || '';
            urlSuffix = arguments[1];
        }

        if (!types.isString(urlSuffix)) return;
        if ((serviceURL = serviceURLs[serviceName]) === undefined) return urlSuffix;

        urlSuffix = urlSuffix.trim().replace(/^\/+/g, '');

        return serviceURL + urlSuffix;
    },
    /**
     * Timeout by default (10000ms) for all network requests
     * @abstract
     * @property {number}
     */
    netTimeout: 10000,
    /**
     * Called before each network request registered in the model
     * @abstract
     * @method netBeforeSend
     */
    netBeforeSend: function() {},
    /**
     * Called when a network request registered in the model is successful
     * @abstract
     * @method netDone
     * @param {Object} info - informations about the request
     * @param {Object} info.data - data received
     * @param {boolean} info.isActive - true if the model has an active request
     */
    netDone: function(info) {},
    /**
     * Called when an error registered in the model occurs on a network request
     * @abstract
     * @method netFail
     * @param {Object} info - informations about the request
     * @param {Error} info.error - error throwed
     * @param {boolean} info.isActive - true if the model has an active request
     */
    netFail: function(info) {}
};

module.exports = Application;
