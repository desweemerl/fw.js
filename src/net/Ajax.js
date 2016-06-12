/**
 * @module fw/net/Ajax
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var AjaxError = require('../error/AjaxError');
var FwPromise = require('../Promise');
var types = require('../types');

/**
 * Create an instance of fw/net/Ajax which behaves like fw/Promise
 * @class
 * @alias module:fw/net/Ajax
 * @param {string} [url] - the URL of ajax request
 * @param {Object} [options] - optional parameters
 * @param {string} [options.url] - the URL of ajax request
 * @param {string} [options.type] - request type (GET, POST, PUT, PATCH, DELETE or HEAD)
 * @param {Object} [options.data] - data submitted (only for POST, PUT and PATCH requests)
 * @param {string} [options.dataType] - data type submitted (json, xml, text)
 * @param {number} [options.timeout] - timeout of the request
 * @param {function} [options.onLoadStart] - callback function call when request starts
 * @param {function} [options.onProgress] - callback function call when request is in progress
 * @param {function} [options.onLoadEnd] - callback function call when request ends*
 */
class FwAjax {
    /**
     * @constructor
     */
    constructor(options) {
        options = options || {};

        var self = this;
        // Default type is GET
        var type = types.inArray(options.type, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']) ? options.type : 'GET';
        var url = options.url;
        var data = options.data;
        var headers = options.headers;

        if (!options.cache) {
            if (url.indexOf('?') === -1) { url += '?'; }
            // Add a timestamp a the url end to avoid caching (IE fix)
            url += '&' + new Date().getTime();
        }

        this.promise = new FwPromise(function(resolve, reject) {
            var key;

            self.xhr = new XMLHttpRequest();
            // When request is aborted, an AjaxError is thrown
            self.abortPromise = function() {
                reject(new AjaxError({ status: AjaxError.REQUEST_ABORTED }));
            };
            // Open the url
            self.xhr.open(type, url, true);
            // Set content type if dataType is defined
            if (type === 'POST' || type === 'PUT' || type === 'PATCH') {
                switch (options.dataType) {
                    case 'json':
                        self.xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
                        data = JSON.stringify(data);
                        break;
                    case 'xml':
                        if (types.isString(data)) {
                            self.xhr.setRequestHeader('Content-type', 'application/xml; charset=UTF-8');
                        }
                        break;
                    case 'text':
                        if (types.isString(data)) {
                            self.xhr.setRequestHeader('Content-type', 'text/plain; charset=UTF-8');
                        }
                        break;
                }
            }

            for (key in headers) {
                self.xhr.setRequestHeader(key, headers[key]);
            }

            // Set timeout if defined
            if (types.isValidNumber(options.timeout))  { self.xhr.timeout = options.timeout; }
            // Set progression events
            if (types.isFunction(options.onProgress))  { self.xhr.upload.onprogress = options.onProgress; }
            if (types.isFunction(options.onLoadStart)) { self.xhr.upload.onloadstart = options.onLoadStart; }
            if (types.isFunction(options.onLoadEnd))   { self.xhr.upload.onloadend = options.onLoadEnd; }
            // When the ajax request is aborted, an AjaxError is thrown
            self.xhr.upload.abort = function() {
                reject(new AjaxError({ status: AjaxError.REQUEST_ABORTED }));
            };
            // When the ajax request is failed, an AjaxError is thrown
            self.xhr.upload.onerror = function() {
                reject(new AjaxError({ status: AjaxError.REQUEST_ERRONEOUS }));
            };
            // When the ajax request has timeout, an AjaxError is thrown
            self.xhr.ontimeout = function() {
                self.xhr.abort();
                reject(new AjaxError({ status: AjaxError.REQUEST_TIMEOUT }));
            };
            // When the ajax request give a 0 status code, an AjaxError is thrown
            self.xhr.onreadystatechange = function() {
                if (self.xhr.readyState !== 4) return;

                var status = self.xhr.status;
                var headers = function(name) { return self.xhr.getResponseHeader(name); };
                var data = self.xhr.responseText;
                var jsonResponse = false;
                var contentType = self.xhr.getResponseHeader('Content-type') || '';

                if (self.xhr.status === 0) {
                    reject(new AjaxError({ status: AjaxError.CONNECTION_REFUSED }));
                } else {
                    // Process response if a processor exists
                    if (types.isFunction(options.processResponse)) {
                        data = options.processResponse(data);
                    } else {
                        // Parse the response if the content is json formatted
                        if (types.isString(data) && contentType.lastIndexOf('application/json') === 0) {
                            if (data.length > 0) {
                                data = JSON.parse(data);
                                jsonResponse = true;
                            }
                        }
                    }
                    // If status is 2XX or 304, the Ajax Promise is resolved
                    if ((status >= 200 && status < 300) || status === 304)  {
                        resolve({
                            status:  status,
                            headers: headers,
                            data:    data
                        });
                    }
                    // If not, the Ajax Promise is rejected
                    else {
                        reject(new AjaxError({
                            i18n:    options.i18n,
                            status:  status,
                            headers: headers,
                            data:    data
                        }));
                    }
                }
            };
            // Start the ajax request
            self.xhr.send(type === 'POST' || type === 'PUT' || type === 'PATCH' ? data : undefined);
        });
    }
    /**
     * "then" function process fulfilled and rejected ajax request
     * @method then
     * @param {function} onFulfilled - called when ajax request is fulfilled
     * @param {function} onRejected - called when ajax request is rejected
     * @return {fw/Promise}
     */
    then(onFulfilled, onRejected) {
        return this.promise.then(onFulfilled, onRejected);
    }
    /**
     * "catch" function process rejected ajax request
     * @method catch
     * @param {function} onRejected - called when ajax request is rejected
     * @return {fw/Promise}
     */
    catch(onRejected) {
        return this.promise.catch(onRejected);
    }
    /**
     * "abort" function process rejected ajax request
     * @method abort
     * @param {function} onFulfilled - called when ajax request is fulfilled
     * @param {function} onRejected - called when ajax request is rejected
     * @return {fw/net/Ajax}
     */
    abort() {
        // Check if the request is uninitialized or opened
        if (this.xhr.readyState === 0 || this.xhr.readyState === 1) {
            this.abortPromise();
        }

        this.xhr.abort();

        return this;
    }
}

module.exports = FwAjax;
