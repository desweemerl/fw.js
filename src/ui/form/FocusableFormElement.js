/**
 * @module fw/ui/form/FocusableFormElement
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var fw = require('../../Core');
var Focusify = require('../Focusify');
var FormElement = require('./FormElement');

/**
 * FocusableFormElement brings focus feature to FormElement
 * @class
 * @alias module:/fw/ui/form/FocusableFormElement
 * @augments fw/ui/form/FocusableFormElement
 * @augments fw/ui/Focusify
 * @param {Object} config - the configuration object parameter
 * @param {boolean} [config.disabled] - disable the form element
 * @param {fw/source/DataSource} [config.dataSource] - dataSource to bind
 * @param {string} [config.property] - element property
 */
class FocusableFormElement extends FormElement {
    /**
     * @constructor
     */
    constructor(config) {
        // Call FormElement initialization
        super(config);
        // Bring focus feature to the Element
        Focusify.call(this, config);
    }
}

fw.extendObject(FocusableFormElement.prototype, Focusify.prototype, {
    /**
     * Bind events to the node
     * @method bindUI
     */   
    bindUI: function() {
        Focusify.prototype.bindUI.call(this);    
        FormElement.prototype.bindUI.call(this);
    }
});

module.exports = FocusableFormElement;
