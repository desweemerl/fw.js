/**
 * @module fw/ui/Template
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var Cache = require('../Cache');
var FwAjax = require('./Ajax');
var FwPromise = require('../Promise');
var I18n = require('../i18n/I18n');
var ModuleError = require('../error/ModuleError');
var types = require('../types');

var cacheType = 'LOCAL';
var cache = {};
var htmlRegExp = /\.html$/;

var storeData = function(key, value, jsonify) {
    switch (cacheType) {
        case 'SESSION':
            Cache.session.set(key, value, jsonify);
            break;
        case 'LOCAL':
            Cache.local.set(key, value, jsonify);
            break;
    }
}; 

var retrieveData = function(key, jsonify) {
    switch (cacheType) {
        case 'SESSION':
            return Cache.session.get(key, jsonify);
        case 'LOCAL':
            return Cache.local.get(key, jsonify);
        default:
            return null;    
    }
};

var Loader = {
    /**
     * Set cache loader type
     * @function setCacheType
     * @param {string} cacheType - cache type ('LOCAL', 'SESSION' or 'NONE')
     */
    setCacheType: function(type) {
        var allowedTypes = ['LOCAL', 'SESSION', 'NONE'];

        if (!types.inArray(allowedTypes, type)) {
            throw new ModuleError({
                moduleName: 'fw/net/Loader',
                message:    'type must be either LOCAL, SESSION or NONE',
                origin:     '"setCacheType" function'
            });
        }

        cacheType = type;
    },
   /**
     * Get cache loader type
     * @function getCacheType
     * @return {string}
     */
    getCacheType: function () {
        return cacheType;
    },
    urlToKeyTranslator: function(url, locale) {
        return ['LOADER', locale, url].join('_'); 
    },
    /**
     * Load data html (asynchronous function)
     * @function load
     * @param {options} options 
     * @return {FwPromise}
     */
    loadHtml: function(options) {
        var key, data;

        options = options || {};
        options.type = 'GET';
        options.cache = true;
        options.dataType = 'text';

        if (!types.isString(options.url)) {
            return FwPromise.reject(new ModuleError({
                moduleName: 'fw/net/Loader',
                message:    'options.url is not a string',
                origin:     '"loadHtml" function'
            }));
        }

        if (!htmlRegExp.test(options.url)) {
            options.url += '.html';
        }

        key = this.urlToKeyTranslator(options.url, options.localized ? I18n.getLocale() : 'default');
        data = retrieveData(key);

        return data === null  ? 
            new FwAjax(options)
                .then(function(response) { 
                    storeData(key, response.data);

                    return FwPromise.resolve(response.data);
                }) :
            FwPromise.resolve(data);                   
    },
    /**
     * Load data json (asynchronous function)
     * @function loadJson
     * @param {options} options
     * @return {FwPromise}
     */
    loadJson: function(options) {
        var key, data;

        options = options || {};
        options.type = 'GET';
        options.dataType = 'json';

        if (!types.isString(options.url)) {
            return FwPromise.reject(new ModuleError({
                moduleName: 'fw/net/Loader',
                message:    'options.url is not a string',
                origin:     '"loadJson" function'
            }));
        }

        key = this.urlToKeyTranslator(options.url, options.localized ? I18n.getLocale() : 'default');

        if (cache.hasOwnProperty(key)) {
            return FwPromise.resolve(cache[key]); 
        }

        data = retrieveData(key, true);

        if (data === null) {
            return new FwAjax(options)
                .then(function(response) {
                    cache[key] = response.data;
                    storeData(key, response.data, true); 

                    return FwPromise.resolve(response.data);
                });           
        }

        cache[key] = data;

        return FwPromise.resolve(data); 
    }
    
    /**
     * Get previously downloaded json object 
     * @function getJson
     * @param {string} url 
     * @return {Object}    
     */
    /*
    getJson: function(url) {
        if (!types.isString(options.url)) {
            return FwPromise.reject(new ModuleError({
                moduleName: 'fw/net/Loader',
                message:    'options.url is not a string',
                origin:     '"getJson" function'
            }));
        };

        return cacheJson[url].data;
    }*/
};

module.exports = Loader;
