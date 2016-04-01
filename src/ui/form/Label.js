/**
 * @module fw/ui/form/Label
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var fw = require('../../Core');
var FormElement = require('./FormElement');

/**
 * Create an UI label element
 * @class
 * @alias module:/fw/ui/form/Label
 * @augments fw/ui/form/FormElement
 * @param {Object} [config] - the configuration object of the label
 * @param {fw/source/DataSource} [config.dataSource]
 * @param {string} [config.property] - the label datasource property
 * @param {function} [config.prepareValue] - function(value) return a transformed value
 * @param {boolean} [config.formatHTML] - if set to true, the value is interpreted as an HTML content
 */
class FwLabel extends FormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-label'; // jshint ignore:line
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */  
    initialize() {
        this.formatHTML = this.config.formatHTML || this.formatHTML || false;
        this.prepareValue = this.config.prepareValue || null;
    }
    /**
     * Process this.config.node if defined (to retrieve attributes) and return properties
     * @method processConfigNode
     * @param {Node} node
     * @return {Object} properties
     */
    proccesNode(node) {
        return {
            property:   node.getAttribute('property'),
            formatHTML: node.getAttribute('formatHTML')
        };
    }
    /**
     * Set the Label value
     * @method setValue
     * @param {*} value
     */
    setValue(value) {
        var lines, n, l;

        this.value = value;

        if (fw.isFunction(this.prepareValue)) {
            value = this.prepareValue(value);
        }

        if (fw.isString(value)) {
            if (value.length === 0) {
                this.node.innerHTML = '&nbsp;';
            } else {
                fw.emptyNode(this.node);

                if (this.formatHTML) {
                    this.node.innerHTML = value;
                } else {
                    lines = value.split('\n');

                    for (n = 0, l = lines.length - 1; n <= l; n++) {
                        this.node.appendChild(document.createTextNode(lines[n]));
                        if (n !== l) {
                            this.node.appendChild(document.createElement('br'));
                        }
                    }
                }
            }
        } else if (fw.isValidNumber(value)) {
            fw.emptyNode(this.node);
            this.node.appendChild(document.createTextNode(value));
        } else if (fw.isNotNull(value) && fw.isFunction(value.toString)) {
            this.node.innerHTML = value.toString() || '&nbsp;';
        } else {
            this.node.innerHTML = '&nbsp;';
        }
    }
}

module.exports = FwLabel;
