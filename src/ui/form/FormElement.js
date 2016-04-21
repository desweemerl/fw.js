/**
 * @module fw/ui/form/FormElement
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var DataSource = require('../../source/DataSource');
var fw = require('../../Core');
var FwElement = require('../Element');

/**
 * FormElement allows binding fw/source/DataSource
 * @class
 * @alias module:/fw/ui/form/FormElement
 * @augments fw/ui/Element
 * @param {Object} config - the configuration object parameter
 * @param {fw/source/DataSource} [config.dataSource] - dataSource to bind
 * @param {string} [config.property] - element property
 */
class FormElement extends FwElement {
    /**
     * @constructor
     */
    constructor(config) {
        // Call Element initialization
        super(config);
        // Define property and dataSource
        this.setProperty(this.config.property || this.property);
        this.setDataSource(this.config.dataSource || this.dataSource);
        // Set value to element if dataSource is not defined
        if (!(this.dataSource instanceof DataSource)) {
            this.setValue(this.config.value || this.value);
        }
    }
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */  
    initialize() {
        this.value = null;
    }
    /**
     * Bind all events to the node
     * @method bindUI
     */
    bindUI() {
        this.onAttributeChange('property', this.setProperty);
    }
    /**
     * Set the property of the FormElement
     * @method setProperty
     * @param {string|null} property
     */
    setProperty(property) {
        if (fw.isEmptyString(property)) {
            property = null;
        }

        if (this.property !== property) {
            this.property = property;

            if (this.dataSource instanceof DataSource) {
                this.dataSource.bind(this);
            }
        }
    }
    /**
     * Get the property of the FormElement
     * @method getProperty
     * @return {string|null}
     */
    getProperty(property) {
        return this.property;
    }
    /**
     * Set the DataSource of the FormElement
     * @method setDataSource
     * @param {fw/source/DataSource} dataSource - dataSource linked to the form element
     */
    setDataSource(dataSource) {
        if (this.dataSource !== dataSource) {
            if (this.dataSource instanceof DataSource) {
                this.dataSource.unbind(this);
            }

            if (dataSource instanceof DataSource) {
                dataSource.bind(this);
            } else {
                this.dataSource = null;
            }
        }
    }
    /**
     * Get the DataSource of the FormElement
     * @method getDataSource
     * @return {fw/source/DataSource}
     */
    getDataSource() {
        return this.dataSource;
    }
    /**
     * Return the FormElement value
     * @method getValue
     * @return {*}
     */
    getValue() {
        return this.value;
    }
    /**
     * Set the FormElement value
     * @method setValue
     * @param {*} value
     */
    setValue(value) {
        this.value = value;
    }
}

module.exports = FormElement;
