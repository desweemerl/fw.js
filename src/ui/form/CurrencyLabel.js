/**
 * @module fw/ui/form/CurrencyLabel
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var fw = require('../../Core');
var FwCurrency = require('../../type/Currency');
var FormElement = require('./FormElement');

/**
 * Create an UI currency label element
 * @class
 * @alias module:/fw/ui/form/CurrencyLabel
 * @augments fw/ui/form/FormElement
 * @param {Object} [config] - the configuration object of the currency label
 * @param {fw/source/DataSource} [config.dataSource]
 * @param {string} [config.property] - the currency label datasource property
 */
class FwCurrencyLabel extends FormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-currencylabel'; // jshint ignore:line
    /**
     * Define element type
     * @property type
     */
    static type = FwCurrency;
    /**
     * Set the CurrencyLabel value
     * @method setValue
     * @param {number|fw/type/Currency} value
     */
    setValue(value) {
        this.value = value instanceof FwCurrency ? value : new FwCurrency(value);
        this.node.innerHTML = this.value.toString() || '&nbsp;';
    }
}

module.exports = FwCurrencyLabel;
