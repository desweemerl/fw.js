/**
 * @module fw/ui/ArrayElement
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var ElementError = require('../error/ElementError');
var FwElement = require('./Element');
var types = require('../types');

/**
 * Create an array element which supports multiple properties and synchronization
 * @class
 * @alias module:fw/ui/ElementArray
 * @augments fw/ui/Element
 */
class ElementArray extends FwElement {
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     * @param {Object} config - the configuration object parameter
     * @param {Object} [config.i18n] - the dictionary which contains the translations
     * @param {boolean} [config.visible] - set the visibility of the UI Element
     * @param {Node} node - the base node of the UI Element
     */
    initialize() {
        this.properties = {};
    }
    /**
     * Synchronize the element with its ArraySource
     * @method synchronize
     * @abstract
     */
    synchronize(action) {
        throw new ElementError({
            elementName: 'ElementArray',
            message:     'synchronize method must be implemented',
            origin:      'synchronize method'
        });
    }
    /**
     * Add property to the element
     * @method addProperty
     * @param {string} name - property name
     * @param {Object} settings - settings for property
     */
    addProperty(name, settings) {
        if (!types.isEmptyString(name) && types.isObject(settings)) {
            this.properties[name] = settings;
        }
    }
}

module.exports = ElementArray;
