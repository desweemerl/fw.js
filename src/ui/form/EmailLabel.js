/**
 * @module fw/ui/form/EmailLabel
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var fw = require('../../Core');
var FormElement = require('./FormElement');

/**
 * Create an UI email label element
 * @class
 * @alias module:/fw/ui/form/EmailLabel
 * @augments fw/ui/form/FormElement
 * @param {Object} [config] - the configuration object of the date label
 * @param {fw/source/DataSource} [config.dataSource]
 * @param {string} [config.property] - the date label datasource property
 */
class FwEmailLabel extends FormElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-emaillabel'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-emaillabel'; // jshint ignore:line
    /**
     * Define element type
     * @property type
     */
    static type = 'string';
    /**
     * Create the EmailLabel node
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node.classList.add('fw-emaillabel');
        this.linkNode = document.createElement('a');
        this.node.appendChild(this.linkNode);
    }
    /**
     * Create the EmailLabel nodes
     * @method buildUI
     * @private
     */
    bindUI() {
        super.bindUI();

        this.on('click', this.onClick);
    }
    /**
     * click event handler
     * @method onClick
     * @private
     */
    onClick(e) {
        if (e.target === this.linkNode && this.value === null) {
            e.preventDefault();
        }
    } 
    /**
     * Set the EmailLabel value
     * @method setValue
     * @param {string} value
     */
    setValue(value) {
        if (fw.isString(value) && value.length > 0) {
            this.value = value;
            this.removeClass('empty');
            fw.emptyNode(this.linkNode);
            this.linkNode.appendChild(document.createTextNode(value));
            this.linkNode.href = 'mailto:' + value;
        } else {
            this.value = null;
            this.addClass('empty');
            this.linkNode.innerHTML = '&nbsp;';
            this.linkNode.href = '#';
        }
    }
}

module.exports = FwEmailLabel;
