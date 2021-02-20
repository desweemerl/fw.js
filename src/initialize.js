/**
 * @module fw/initialize
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var dom = require('./dom');
var I18n = require('./i18n/I18n');
var i18nAjax = require('./nls/ajax');

I18n.addDictionary('i18nAjax', i18nAjax);

/**
 * Initialize the application
 * @function initialize
 * @param {Object} config - the configuration object parameter
 * @return {fw/Promise}
 */
var initialized = false;

function initialize(config) {
    config = config || {};

    return dom.documentReady().then(function() {
        var ctlActivated = false;

        if (!initialized) {
            initialized = true;
            // Prevent CTRL-Z to be used
            window.addEventListener('keydown', function(e) {
                if (e.which === 17) {
                    ctlActivated = true;
                } else if (ctlActivated) {
                    if (e.which === 90) {
                        e.preventDefault();
                    }
                }
            }, false);

            window.addEventListener('keyup', function(e) {
                if (e.which === 17) {
                    ctlActivated = false;
                }
            }, false);
        }
    });
}

module.exports = initialize;
