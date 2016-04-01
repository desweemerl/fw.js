/**
 * @module fw/ui/form/FocusableElement
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var fw = require('../Core');
var Focusify = require('./Focusify');
var FwElement = require('./Element');

/**
 * FocusableElement brings focus feature to the Element
 * @class
 * @alias module:/fw/ui/form/FocusableElement
 * @augments fw/ui/Element
 * @augments fw/ui/Focusify
 * @param {Object} config - the configuration object parameter
 * @param {boolean} [config.disabled] - disable the form element
 * @param {fw/source/DataSource} [config.dataSource] - dataSource to bind
 * @param {string} [config.property] - element property
 */
class FocusableElement extends FwElement {
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

fw.extendObject(FocusableElement.prototype, Focusify.prototype);

module.exports = FocusableElement;
