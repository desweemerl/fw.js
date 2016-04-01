/**
 * @module fw/ui/form/DateLabel
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var FwDate = require('../../type/Date');
var FormElement = require('./FormElement');

/**
 * Create an UI data label element
 * @class
 * @alias module:/fw/ui/form/DateLabel
 * @augments fw/ui/form/FormElement
 * @param {Object} [config] - the configuration object of the date label
 * @param {fw/source/DataSource} [config.dataSource]
 * @param {string} [config.property] - the date label datasource property
 */

class FwDateLabel extends FormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-datelabel'; // jshint ignore:line
    /**
     * Define element type
     * @property type
     */
    static type = FwDate;
    /**
     * Set the DateLabel value
     * @method setValue
     * @param {number|fw/type/Date} value
     */
    setValue(value) {
        this.value = value instanceof FwDate ? value : new FwDate(value);
        this.node.innerHTML = this.value.toDMYString() || '&nbsp;';
    }
}

module.exports = FwDateLabel;
