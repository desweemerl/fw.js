/**
 * @module fw/ui/component/Spinner
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var fw = require('../../Core');
var ElementModal = require('../ElementModal');

var currentSpinner;

/**
 * Create a spinner UI element
 * @class
 * @alias module:fw/ui/component/Spinner
 * @augments fw/ui/ElementModal
 */
class FwSpinner extends ElementModal {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-spinner'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-spinner'; // jshint ignore:line   
    /**
     * Build UI element nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node.setAttribute('tabindex', '0');
        this.node.innerHTML = '<div>&#xF01E</div>';
    }
    /**
     * Show the spinner 
     * @method show
     */
    show() {
        if (currentSpinner) {
            if (currentSpinner !== this) {
                currentSpinner.hide();
            } else {
                return;
            }
        }

        currentSpinner = this;
        super.show();
    }
    /**
     * Hide the progressbar
     * @method hide
     */
    hide() {
        if (!currentSpinner) return;

        currentSpinner = null;
        super.hide();
    }
}

module.exports = FwSpinner;
