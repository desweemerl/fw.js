/**
 * @module fw/source/SearchSource
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var AjaxError = require('../error/AjaxError');
var AjaxSource = require('../source/AjaxSource');
var DataSource = require('../source/DataSource');
var FwAjax = require('../net/Ajax');
var FwElement = require('../ui/Element');
var FwPromise = require('../Promise');
var types = require('../types');
var utils = require('../utils');

/**
 * Create an instance of fw/source/SearchSource associated with the fw/ui/form/(.*)
 * @class
 * @alias module:fw/source/SearchSource
 * @augments fw/source/AjaxSource
 * @param {Object} config - the configuration object of the SearchSource
 * @param {string} config.url - the URL of ajax request
 * @param {Object} [config.parameters] - optional parameters sent in each ajax request
 * @param {number} [config.timeout] - timeout of the request
 */
class SearchSource extends AjaxSource {
    /**
     * @constructor
     */
    constructor(config) {
        var self = this;

        super(config);

        this.list = [];
        this.element = null;

        this.done(function(response) {
            self.list = response.data instanceof Array ? response.data : [];
        });
    }
    /**
     * Bind a UI Element to the SearchSource
     * @method bind
     * @param {fw/ui/Element} - Element to bind to the SearchSource
     */
    bind(element) {
        if (!(element instanceof FwElement)) return;
        if (element.searchSource !== this && element.searchSource instanceof SearchSource) {
            element.searchSource.unbind();
        }

        element.searchSource = this;
        this.element = element;
    }
    /**
     * Unbind a UI Element from the SearchSource
     * @method unbind
     */
    unbind() {
        if (this.element === null) return;
        this.abort();
        this.element.searchSource = null;
        this.element = null;
    }
    /**
     * Process parameters before sending the request
     * @method processParameters
     * @param {Object} parameters
     * @return {Object} processed parameters
     */
    processParameters(parameters) {
        parameters.filter = types.isString(parameters.filter) ? parameters.filter : '';

        return parameters;
    }
}

module.exports = SearchSource;
