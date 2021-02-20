/**
 * @module fw/ui/form/TimestampLabel
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var FormElement = require('./FormElement');
var FwTimestamp = require('../../type/Timestamp');

/**
 * Create an UI timestamp label element
 * @class
 * @alias module:/fw/ui/form/LabelLabel
 * @augments fw/ui/form/FormElement
 * @param {Object} [config] - the configuration object of the label
 * @param {fw/source/DataSource} [config.dataSource]
 * @param {string} [config.property] - the label datasource property
 */
class FwTimestampLabel extends FormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-timestamplabel'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-timestamplabel'; // jshint ignore:line
    /**
     * Define element type
     * @property type
     */
    static type = FwTimestamp;
    /**
     * Set the TimestampLabel value
     * @method setValue
     * @param {fw/type/Time} value
     */
    setValue(value) {
        this.value = value instanceof FwTimestamp ? value : new FwTimestamp(value);
        this.node.innerHTML = this.value.toDMYHMSString() || '&nbsp;';
    }
}

module.exports = FwTimestampLabel;
