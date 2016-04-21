/**
 * @module fw/source/PaginatedArraySource
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var AjaxSource = require('../source/AjaxSource');
var ArrayElement = require('../ui/ArrayElement');
var ArrayModel = require('../ArrayModel');
var DataSource = require('../source/DataSource');
var FwAjax = require('../net/Ajax');
var FwPromise = require('../Promise');
var ObjectModel = require('../ObjectModel');
var SourceError = require('../error/SourceError');
var types = require('../types');
var utils = require('../utils');

/**
 * Create an instance of fw/source/PaginatedArraySource
 * @class
 * @augments AjaxSource
 * @alias module:fw/source/PaginatedArraySource
 * @param {Object} config - the configuration object of the SearchSource
 * @param {string} config.url - the URL of ajax request
 * @param {ArrayModel|Object} config.model - the source model
 * @param {Object} [config.parameters] - optional parameters sent in each ajax request
 * @param {number} [config.timeout] - timeout of the request
 * @param {number} [config.size] - page size 
 */
class PaginatedArraySource extends AjaxSource {
    /**
     * @constructor
     */
    constructor(config) {
        super(config);

        var self = this;

        this.size = this.config.size || 10;
        this.url = this.config.url || null;
        this.enabled = false;
        this.element = null;

        if (ObjectModel.isClass(this.config.model)) {
            this.model = ArrayModel({ model: this.config.model }); // jshint ignore:line
        } else if (types.isObject(this.config.model)) {
            this.model = ArrayModel({ model: this.config.model }); // jshint ignore:line
        } else {
            this.model = ArrayModel(); // jshint ignore:line
        }

        this.source = new this.model(this.config.array);
        this.clear();

        this.beforeDone(function() {
            if (self.element) {
                self.element.synchronize('beforeLoad');
            }
        })
        .done(function(response) {
            var data = response.data || {};

            self.source.setArray(data.list);
            self.count = data.count;
            self.order = data.order;
            self.orderAsc = data.orderAsc;
            self.page = data.page;
            self.maxPages = data.maxPages;
            self.size = data.size;

            if (self.element) {
                self.element.synchronize('load');
            }
        })
        .fail(function(error) {
            if (self.element) {
                self.element.synchronize('fail');
            }

            throw error;
        });
    }
    /**
     * Process parameters before sending the request
     * @method processParameters
     * @param {Object} parameters
     * @return {Object} processed parameters
     */
    processParameters(parameters) {
        parameters.size = parameters.size || this.size;
        parameters.page = parameters.page || this.page || 1;
        parameters.order = parameters.order || this.order;

        if (types.isString(parameters.order)) {
            parameters.orderAsc = types.isBoolean(parameters.orderAsc) ? parameters.orderAsc : true;
        }

        return parameters;
    }
    /**
     * Return the stored array
     * @method getArray
     * @return {Array}
     */
    getArray() {
        return this.source.getArray();
    }
    /**
     * Return the source stored
     * @method getSource
     * @return {ArrayModel}
     */
    getSource() {
        return this.source;
    }
    /**
     * Return the source size
     * @method getSize
     * @return {number}
     */
    getSize() {
        return this.source.getSize();
    }
    /**
     * Return the element at specified index
     * @method get
     * @param {number} index
     * @return {ObjectModel}
     */
    get(index) {
        return this.source.get(index);
    }
    /**
     * Fetch data with a specified page and size
     * @method getPage
     * @param {number} page - page fetched
     * @param {Object} options - options associated with the request
     * @param {number} [options.size] - size of the fetched page
     * @param {string} [options.order] - field name on which an order is set up
     * @param {boolean} [options.orderAsc] - ascending order
     * @param {Object} [params] - additional parameters
     * @param {number} [timeout] - timeout of the request
     * @return {fw/Promise}
     */
    getPage(page, options) {
        options = options || {};
        options.page = page;

        return this.load(options);
    }
    /**
     * Fetch data of the first page
     * @method getFirstPage
     * @param {Object} options - options associated with the request
     * @param {number} [options.size] - size of the fetched page
     * @param {string} [options.order] - field name on which an order is set up
     * @param {boolean} [options.orderAsc] - ascending order
     * @param {Object} [params] - additional parameters
     * @return {fw/Promise}
     */
    getFirstPage(options) {
        return this.getPage(1, options);
    }
    /**
     * Fetch data of the previous page
     * @method getPreviousPage
     * @param {Object} options - options associated with the request
     * @param {number} [options.size] - size of the fetched page
     * @param {string} [options.order] - field name on which an order is set up
     * @param {boolean} [options.orderAsc] - ascending order
     * @param {Object} [params] - additional parameters
     * @return {fw/Promise}
     */
    getPreviousPage(options) {
        return this.getPage(this.page - 1, options);
    }
    /**
     * Fetch data of the last page
     * @method getLastPage
     * @param {Object} options - options associated with the request
     * @param {number} [options.size] - size of the fetched page
     * @param {string} [options.order] - field name on which an order is set up
     * @param {boolean} [options.orderAsc] - ascending order
     * @param {Object} [params] - additional parameters
     * @return {fw/Promise}
     */
    getLastPage(options) {
        return this.getPage(this.maxPages, options);
    }
    /**
     * Fetch data of the last page
     * @method getNextPage
     * @param {Object} options - options associated with the request
     * @param {number} [options.size] - size of the fetched page
     * @param {string} [options.order] - field name on which an order is set up
     * @param {boolean} [options.orderAsc] - ascending order
     * @param {Object} [params] - additional parameters
     * @return {fw/Promise}
     */
    getNextPage(options) {
        return this.getPage(this.page + 1, options);
    }
    /**
     * Clear the PaginatedArraySource
     * @method clear
     */
    clear() {
        this.source.clear();
        this.order = null;
        this.orderAsc = true;
        this.count = 0;
        this.maxPages = 0;
        this.page = 0;

        if (this.element) {
            this.element.synchronize('init'); 
        }
    }
    /**
     * Refresh data with options passed as argument and defined during the instantiation
     * @method refresh
     * @param {Object} options - options associated with the request
     * @param {number} [options.page] - page fetched
     * @param {number} [options.size] - size of the fetched page
     * @param {string} [options.order] - field name on which an order is set up
     * @param {boolean} [options.orderAsc] - ascending order
     * @param {Object} [params] - additional parameters
     * @return {fw/Promise}
     */
    refresh(options) {
        if (this.element) {
            return this.load(options);
        }
    }
    /**
     * Bind an element to the PaginatedArraySource
     * @method bind
     * @param {fw/ui/Element} element
     */
    bind(element) {
        if (!(element instanceof ArrayElement)) return;
        if (this.element === element) return;

        var configModified = false;
        var arrayModel = this.model.getModel();
        var config = {};
        var name;
        // Adapt model to element properties 
        function addProperty(element, name, parameters) {
            var propConf = {};
            var definedType = arrayModel.getType(name);
            // If type is defined for the element, check if it matches the property type in the model
            if (!types.isEmptyString(parameters.type) || types.isFunction(parameters.type)) {
                if (definedType === undefined || definedType === '*') {
                    propConf.type = parameters.type;
                }
                // If column type doesn't match the model type, throws an error
                else if (parameters.type !== '*' && definedType !== parameters.type) {
                    throw new SourceError({
                        sourceName: 'PaginatedArraySource',
                        origin:     'element binding',
                        message:    'property "' + name + '"has already a type',
                        element:    element 
                    });
                }
            } else if (definedType === undefined) {
                propConf.type = '*';
            }
            // Check if changes must be done on the model
            if (!types.isEmptyObject(propConf)) {
                utils.setValueToObject(config, 'fields.' + name, propConf);
                configModified = true;
            }
        }

        if ((element.paginatedArraySource !== this) && (element.paginatedArraySource instanceof PaginatedArraySource)) {
            element.paginatedArraySource.unbind();
        }

        for (name in element.properties) {
            addProperty(element, name, element.properties[name]);
        }

        this.element = element;
        element.paginatedArraySource = this;

        if (configModified) {
            this.model = ArrayModel({ model: arrayModel.extend(config) }); // jshint ignore:line
            this.source = new this.model(this.source.getArray());
        }

        this.clear();
    }
    /**
     * Unbind element from the PaginatedArraySource
     * @method unbind
     */
    unbind() {
        this.size = this.config.size || 10;
        if (!this.element) return;
        this.element.paginatedArraySource = null;
        this.element = null;
    }
}

module.exports = PaginatedArraySource;
