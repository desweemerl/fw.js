/**
 * @module fw/source/Source
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var SourceError = require('../error/SourceError');

/**
 * The fw/source/Source class is the base for all sources
 * @class
 * @alias module:/fw/source/Source
 * @param {Object} config - the configuration object parameter
 */
class Source {
    /**
     * @constructor
     */
    constructor(config) {
        this.config = config || {};
    }
    /**
     * Bind UI element(s) to the Source
     * @method bind
     * @param {fw/ui/Element|fw/ui/Element[]} element(s) - element or array of elements bound to the Source
     */
    bind() {
        throw new SourceError({
            sourceName:  'Source',
            message:     'method bind must be implemented',
            origin:      'method bind'
        });
    }
    /**
     * Unbind UI element(s) to the Source
     * @method unbind
     * @param {fw/ui/Element|fw/ui/Element[]} element(s) - element or array of elements unbound from the Source
     */
    unbind() {
        throw new SourceError({
            sourceName:  'Source',
            message:     'method unbind must be implemented',
            origin:      'method unbind'
        });
    }
}

module.exports = Source;
