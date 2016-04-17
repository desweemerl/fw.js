/**
 * @module fw/i18n/I18n
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var Cache = require('../Cache');
var FwPromise = require('../Promise');
var ModuleError = require('../error/ModuleError');
var types = require('../types');
var utils = require('../utils');

var cacheType = 'LOCAL'; 
var register = {};
var localeRegExp = /^([a-z]{2})(?:[-_]([A-Z]{2}))?$/;
var languageRegExp = /^([a-z]{2})/;
var argRegExp = /\{(\w+)\}/g;

var defaultLocale = 'default';
var currentLocale = navigator.language || navigator.userLanguage;
var currentLocaleArray = localeRegExp.exec(currentLocale);

var storeData = function(key, value) {
    switch (cacheType) {
        case 'SESSION':
            Cache.session.set(key, value, true);
            break;
        case 'LOCAL':
            Cache.local.set(key, value, true);
            break;
    }
}; 

var retrieveData = function(key) {
    switch (cacheType) {
        case 'SESSION':
            return Cache.session.get(key, true);
        case 'LOCAL':
            return Cache.local.get(key, true);
        default:
            return null;    
    }
};

// Load dictionary
function getDictionary(name, url, locale) {
    var cache = register[name].cache;
    var key, data, ajax;

    if (cache.hasOwnProperty(locale)) {
        return FwPromise.resolve(cache[locale]);
    }
    
    key = I18n.urlToKeyTranslator(url, locale);
    data = retrieveData(key);

    if (data === null) {
        return new FwAjax({ 
                url:             url + locale + '.json', 
                type:            'GET',
                cache:           true 
            })
            .then(function(response) {
                cache[locale] = response.data;
                storeData(key, response.data);   
                
                return FwPromise.resolve(response);    
            })
            .catch(function() {
                cache[locale] = {};

                return FwPromise.resolve({});    
            });
    }

    cache[locale] = data;

    return FwPromise.resolve(data);

/*
            if (!types.isObject(data) && data.constructor !== Object) {
                return new FwPromise.reject(new ModuleError({
                    moduleName: 'fw/I18n',
                    message:    'dictionary at url "' + url + '" with name "' + name + '" is not an object',
                    origin:     '"setLocale" function'
                }));
            }

            cacheDictionaries[name] = cacheDictionaries[name] || {};
            cacheDictionaries[name][locale] = data;
*/
}

/**
 * Manage locales and dictionaries
 */
var I18n = {
    /**
     * Set cache loader type
     * @function setCacheType
     * @param {string} cacheType - cache type ('LOCAL', 'SESSION' or 'NONE')
     */
    setCacheType: function(type) {
        var allowedTypes = ['LOCAL', 'SESSION', 'NONE'];

        if (!types.inArray(allowedTypes, type)) {
            throw new ModuleError({
                moduleName: 'fw/i18n/I18n',
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
    /**
     *
     *
     *
     */    
    urlToKeyTranslator: function(url, locale) {
        return ['I18N', locale, url].join('_'); 
    },
    /**
     * Set the locale
     * @function setLocale
     * @param {string} locale - locale under formats en_US or en-US
     */
    setLocale: function(locale) {
        var localeArray = localeRegExp.exec(locale);

        if (!localeArray) {
           throw new ModuleError({
                moduleName: 'fw/I18n',
                message:    'locale "' + locale + '" is not valid',
                origin:     '"setLocale" function'
            });
        }

        currentLocale = locale;
        currentLocaleArray = localeArray;
    },
    /**
     * Get the locale
     * @function getLocale
     * @return {string}
     */
    getLocale: function() {
        return currentLocale;
    },
    /**
     * Set the default locale
     * @function setDefaultLocale
     * @param {string} locale - locale under formats en_US or en-US or "default" value
     */
    setDefaultLocale: function(locale) {
        var localeArray = localeRegExp.exec(locale);

        if (locale === 'default' || localeRegExp.exec(locale)) {
            defaultLocale = locale;
        } else {
            throw new ModuleError({
                moduleName: 'fw/I18n',
                message:    'locale "' + locale + '" is not valid',
                origin:     '"setDefaultLocale" function'
            });
        }
    },
    /**
     * Get the default locale
     * @function getDefaultLocale
     * @return {string}
     */
    getDefaultLocale: function() {
        return currentLocale;
    },   
    /**
     * Synchronize all unloaded dictionaries with the locale
     * @function syncDictionaries
     * @return {fw/Promise}
     */ 
    syncDictionaries: function() {
        var promises = [];
        var name, locales, url, matchedLocale;

        for(name in register) {
            locales = register[name].locales;
            url = register[name].url;

            if (types.isEmptyString(url)) continue;

            if (locales.indexOf(currentLocale) !== -1) {
                matchedLocale = currentLocale;
            } else if (currentLocaleArray[2] && locales.indexOf(currentLocaleArray[1]) !== -1) {
                matchedLocale = currentLocaleArray[1];
            } else {
                matchedLocale = defaultLocale;
            }

            promises.push(getDictionary(name, url, matchedLocale));       
        }

        return FwPromise.all(promises);   
    },
    /**
     * Get the language
     * @function getLanguage
     * @return {string}
     */
    getLanguage: function() {
        return currentLocaleArray[1];
    },
    /**
     * Register dictionary
     * @function registerDictonary
     * @param {string} name - dictionary name
     * @param {Array} locales - dictionary locales
     * @param {string} [url] - dictionary url
     */
    registerDictionary: function(name, locales, url) {
        var n, l;

        if (types.isEmptyString(name)) {
            throw new ModuleError({
                moduleName: 'fw/I18n',
                message:    'name is missing',
                origin:     '"registerDictonary" function'
            });
        }

        if (!(locales instanceof Array)) {
            throw new ModuleError({
                moduleName: 'fw/I18n',
                message:    'locales is not an array',
                origin:     '"registerDictonary" function'
            });
        }

        if (types.isEmptyString(url)) {
            throw new ModuleError({
                moduleName: 'fw/I18n',
                message:    'url is not a valid string',
                origin:     '"registerDictonary" function'
            });
        }

        for (n = 0, l = locales.length; n < l; n++) {
            if (!localeRegExp.exec(locales[n])) {
                throw new ModuleError({
                    moduleName: 'fw/I18n',
                    message:    'locale "' + locales[n] + '" is not valid',
                    origin:     '"registerDictionary" function'
                });
            }
        }

        register[name] = { 
            locales: locales,
            url:     url.replace(/\/*$/, '/'),
            cache:   {}                         
        };
    },
    /**
     * Register dictionaries
     * @function registerDictonaries
     * @param {Object} dictionaries - dictionaries
     */
    registerDictionaries: function(dictionaries) {
        var name, dictionary;
        var n, l;

        if (!types.isObject(dictionaries)) {
            throw new ModuleError({
                moduleName: 'fw/I18n',
                message:    'dictionaries is not an object',
                origin:     '"registerDictonaries" function'
            });
        }

        for (name in dictionaries) {
            dictionary = dictionaries[name];

            if (types.isObject(dictionary)) {
                if (!(dictionary.locales instanceof Array)) {
                    throw new ModuleError({
                        moduleName: 'fw/I18n',
                        message:    'locales is not array for dictionary "' + name + '"',
                        origin:     '"registerDictonaries" function'
                    });
                }

                for (n = 0, l = dictionary.locales.length; n < l; n++) {
                    if (!localeRegExp.exec(dictionary.locales[n])) {
                        throw new ModuleError({
                            moduleName: 'fw/I18n',
                            message:    'locale "' + dictionary.locales[n] + '" is not validi for dictionary "' + name + '"',
                            origin:     '"registerDictionaries" function'
                        });
                    }
                }

                if (types.isEmptyString(dictionary.url)) {
                    throw new ModuleError({
                        moduleName: 'fw/I18n',
                        message:    'url not a valid string for dictionary "' + name + '"',
                        origin:     '"registerDictonaries" function'
                    });
                }

                register[name] = { 
                    locales: dictionaries.locales,
                    url:     dictionary.url.replace(/\/*$/, '/'),
                    cache:   {}                                    
                };
            } else {
                throw new ModuleError({
                    moduleName: 'fw/I18n',
                    message:    'dictionary "' + name + '" is neither an object nor an array',
                    origin:     '"registerDictonares" function'
                });
            }
        }
    },
    /**
     * Load a dictionary (asynchronous function)
     * @function loadDictionary
     * @param {string} name - dictionary name
     * @param {string} [locale] - locale under formats en_US or en-US. If not specified, the default locale is used.
     * @return {fw/promise}
     */
    loadDictionary: function(name, locale) {
        var localeArray, locales, url, matchedLocale;

        if (types.isEmptyString(name)) {
            return FwPromise.reject(new ModuleError({
                moduleName: 'fw/I18n',
                message:    'name is missing',
                origin:     '"loadDictionary" function'
            }));
        }

        if (locale === undefined) {
            locale = currentLocale;
            localeArray = currentLocaleArray;
        } else if (types.isEmptyString(locale) || (localeArray = localeRegExp.exec(locale)) === null) {
            return FwPromise.reject(new ModuleError({
                moduleName: 'fw/I18n',
                message:    'locale "' + locale + '" is not valid',
                origin:     '"loadDictionary" function'
            }));
        }

        if (types.isObject(register[name])) {
            locales = register[name].locales;
            url = register[name].url;
        } else {
            return new FwPromise.reject(new ModuleError({
                moduleName: 'fw/I18n',
                message:    'dictionary with name "' + name + '" doesn\'t exist',
                origin:     '"loadDictionary" function'
            }));
        }

        if (locales.indexOf(locale) !== -1) {
            matchedLocale = locale;
        } else if (localeArray[2] && locales.indexOf(localeArray[1]) !== -1) {
            matchedLocale = localeArray[1];
        } else {
            matchedLocale = defaultLocale;
        }

        return getDictionary(name, url, matchedLocale);
    },
    /**
     * Add dictionary (synchronous function)
     * @function addDictionary
     * @param {string} name - dictionary name
     * @param {string} [locale] - locale under formats en_US or en-US. If not specified, the default locale is used.
     * @param {Object} dictionary - dictionary
     */
    addDictionary: function() {
        var regName = register[name] = register[name] || { cache: {} };
        var cache = regName.cache;
        var name, locale, dictionary;

        function addDictForLocale(locale, dict) {
            var localeArray;

            if (!types.isObject(dict)) {
                throw new ModuleError({
                    moduleName: 'fw/I18n',
                    message:    'dictionary for the locale "' + locale + '" is not an object',
                    origin:     '"addDictionary" function'
                });
            }

            if ((types.isString(locale) && locale !== 'default' && (localeArray = localeRegExp.exec(locale)) === null) || !types.isString(locale)) {
                throw new ModuleError({
                    moduleName: 'fw/I18n',
                    message:    'locale "' + locale + '" is not valid',
                    origin:     '"addDictionary" function'
                });
            }

            cache[locale] = dict;
        }

        if (arguments.length === 2) {
            name = arguments[0];
            dictionary = arguments[1];
        } else if (arguments.length > 2) {
            name = arguments[0];
            locale = arguments[1];
            dictionary = arguments[2];
        }

        if (types.isEmptyString(name)) {
            throw new ModuleError({
                moduleName: 'fw/I18n',
                message:    'name is missing',
                origin:     '"addDictionary" function'
            });
        }

        if (locale !== undefined) {
            addDictForLocale(locale, dictionary);
        } else {
            for (locale in dictionary) {
                addDictForLocale(locale, dictionary[locale]);
            }
        }
     },
    /**
     * Tanslate a message with a specified dictionary
     * @function tr
     * @param {Object} options - the options object parameter
     * @param {string} message - message to be translated
     * @param {string} [options.locale] - locale
     * @param {Object|string} [options.dictionary] - the dictionary
     * @param {Array} [options.dictionaries] - dictionaries
     * @return {string}
     */
    tr: function(options) {
        options = options || {};

        var messageTr;
        var locale, localeArray;
        var dictionaries;
        var n;

        function getMessage(dictionary) {
            var msg;

            if (!dictionary) return;

            if (dictionary[localeArray[0]] && (msg = utils.getValueFromObject(dictionary[localeArray[0]], options.message))) {
                return msg;
            } else if (localeArray[2] && (msg = utils.getValueFromObject(dictionary[localeArray[1]], options.message))) {
                return msg;
            } else if (dictionary[defaultLocale] && (msg = utils.getValueFromObject(dictionary[defaultLocale], options.message))) {
                return msg;
            }
        }

        function processDictionary(dictionary) {
            var messageTr, n;

            if (!types.isEmptyString(dictionary) && register[dictionary]) {
                messageTr = getMessage(register[dictionary].cache);
            } else if (dictionary instanceof Array) {
                for (n = dictionary.length - 1; n >= 0; n--) {
                    messageTr = processDictionary(dictionary[n]);
                    if (!fw.isEmptyString(messageTr)) return messageTr;
                }
            } else if (types.isObject(dictionary)) {
                messageTr = getMessage(dictionary);
            }

            return fw.isEmptyString(messageTr) ? null : messageTr;
        }

        if (types.isEmptyString(options.message)) return '';

        if (options.locale) {
            locale = options.locale;

            if (types.isEmptyString(locale) || (localeArray = localeRegExp.exec(locale)) === null) {
                throw new ModuleError({
                    moduleName: 'fw/I18n',
                    message:    'locale "' + locale + '" is not valid',
                    origin:     '"tr" function'
                });
            }
        } else {
            locale = currentLocale;
            localeArray = currentLocaleArray;
        }

        if (types.isObject(options.dictionary) || !types.isEmptyString(options.dictionary)) {
            dictionaries = [options.dictionary];
        } else if (options.dictionaries instanceof Array) {
            dictionaries = options.dictionaries;
        }

        if (dictionaries) {
            for (n = dictionaries.length - 1; n >= 0; n--) {
                messageTr = processDictionary(dictionaries[n]);
                if (messageTr) break;
            }
        }

        if (!messageTr) {
            messageTr = options.message;
        }

        if (!types.isEmptyString(messageTr) && types.isObject(options.args)) {
            messageTr = messageTr.replace(argRegExp, function(match, arg) {
                var value = options.args[arg];

                if (value === null || value === undefined) return match;
                if (types.isFunction(value.toString)) return value.toString();

                return '';
            });
        }

        return messageTr || '';
    }
};

module.exports = I18n;

var FwAjax = require('../net/Ajax'); // Fix circular dependencies
