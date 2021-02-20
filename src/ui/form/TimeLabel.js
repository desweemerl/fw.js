/**
 * @module fw/ui/form/TimeLabel
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var FwTime = require('../../type/Time');
var FormElement = require('./FormElement');

/**
 * Create an UI time label element
 * @class
 * @alias module:/fw/ui/form/LabelLabel
 * @augments fw/ui/form/FormElement
 * @param {Object} [config] - the configuration object of the label
 * @param {fw/source/DataSource} [config.dataSource]
 * @param {string} [config.property] - the label datasource property
 */
class FwTimeLabel extends FormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-timelabel'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-timelabel'; // jshint ignore:line
    /**
     * Define element type
     * @property type
     */
    static type = FwTime;
    /**
     * Set the TimeLabel value
     * @method setValue
     * @param {fw/type/Time} value
     */
    setValue(value) {
        this.value = value instanceof FwTime ? value : new FwTime(value);
        this.node.innerHTML = this.value.toString() || '&nbsp;';
    }
}

module.exports = FwTimeLabel;
