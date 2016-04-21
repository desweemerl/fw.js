/**
 * @module fw/error/AjaxError
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var i18nAjax = require('../nls/ajax');
var Message = require('../i18n/Message');
var types = require('../types');

/**
 * Create an ajax based error
 * @class
 * @alias module:fw/error/AjaxError
 * @augments Error
 * @param {Object} error - error to be thrown
 * @param {number} [error.status] - error status code
 * @param {string} [error.message] - error message
 * @param {Object} [error.fields] - fields errors
 */
class AjaxError extends Error {
    /** 
     * @constructor
     */
    constructor(error) {
        super();

        error = error || {};

        var i18n;

        this.status = 0;
        this.headers = types.isFunction(error.headers) ? error.headers : function() { return null; };
        this.message = null;
        this.data = error.data || null;

        if (types.isValidNumber(error.status)) {
            i18n = error.i18n ? [i18nAjax, error.i18n] : i18nAjax;
            this.status = error.status;

            switch (this.status) {
                case AjaxError.REQUEST_ABORTED:
                    this.message = new Message({ i18n: i18n, message: 'requestAborted' });
                    break;
                case AjaxError.REQUEST_ERRONEOUS:
                    this.message = new Message({ i18n: i18n, message: 'requestErroneous' });
                    break;
                case AjaxError.CONNECTION_REFUSED:
                    this.message = new Message({ i18n: i18n, message: 'connectionRefused' });
                    break;
                case AjaxError.REQUEST_TIMEOUT:
                    this.message = new Message({ i18n: i18n, message: 'requestTimeout' });
                    break;
                case AjaxError.METHOD_NOT_ALLOWED:
                    this.message = new Message({ i18n: i18n, message: 'methodNotAllowed' });
                    break;
                case AjaxError.BAD_GATEWAY:
                    this.message = new Message({ i18n: i18n, message: 'badGateway' });
                    break;    
                case AjaxError.SERVICE_UNAVAILABLE:
                    this.message = new Message({ i18n: i18n, message: 'serviceUnavailable' });
                    break;
            }
        }
    }
}

Object.defineProperties(AjaxError, {
    REQUEST_ABORTED:     { value: 1   },
    REQUEST_ERRONEOUS:   { value: 2   },
    CONNECTION_REFUSED:  { value: 3   },
    BAD_REQUEST:         { value: 400 },
    UNAUTHORIZED:        { value: 401 },
    FORBIDDEN:           { value: 403 },
    NOT_FOUND:           { value: 404 },
    METHOD_NOT_ALLOWED:  { value: 405 },
    REQUEST_TIMEOUT:     { value: 408 },
    BAD_GATEWAY:         { value: 502 },
    SERVICE_UNAVAILABLE: { value: 503 }
});

module.exports = AjaxError;
