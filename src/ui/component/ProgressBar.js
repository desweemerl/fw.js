/**
 * @module fw/ui/component/Progressbar
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var fw = require('../../Core');
var ElementModal = require('../ElementModal');

var currentProgressBar;

/**
 * Create a progressbar UI element
 * @class
 * @alias module:fw/ui/component/Progressbar
 * @augments fw/ui/ElementModal
 * @param {Object} config - the configuration object parameter
 * @param {number} config.percentage - progression percentage
 * @param {string|fw/i18n/Message} [config.message] - message displayed with the progress bar
 * @param {string} [config.width=15em] - progress bar width
 * @param {string} [config.height=1.5em] - progress bar height
 */
class FwProgressBar extends ElementModal {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-progressbar'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-progressbar'; // jshint ignore:line   
    /**
     * Initialize the progressbar UI element
     * @method initialize
     * @private
     */
    initialize() {
        super.initialize();
        this.message = null;
        this.percentage = null;
        this.height = this.config.height || '1.5em';
        this.width = this.config.width || '15em';
    }
    /**
     * Build UI element nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node.setAttribute('tabindex', '0');
        this.node.innerHTML = '<div class="fw-progressbar-bar"><div></div></div><div class="fw-progressbar-info"></div>';
        this.progressbarNode = this.node.firstElementChild;
        this.barNode = this.progressbarNode.firstElementChild;
        this.infoNode = this.node.getElementsByClassName('fw-progressbar-info')[0];

        this.setPercentage(this.config.percentage);
        this.setMessage(this.config.message);
    }
    /**
     * Bind UI element node
     * @method bindUI
     * @private
     */
    bindUI() {
        super.bindUI();

        this.onAttributeChange('message', this.setMessage);
        this.onAttributeChange('percentage', this.setPercentage);
    }
    /**
     * @method setPercentage
     * @param {number} percentage - percentage value
     */
    setPercentage(percentage) {
        if (!fw.isEmptyString(percentage)) {
            percentage = parseFloat(percentage, 10);
        }

        this.percentage = fw.isValidNumber(percentage) ? percentage : 0;

        if (this.percentage < 0) {
            this.percentage = 0;
        } else if (this.percentage > 100) {
            this.percentage = 100;
        }

        this.barNode.style.width = String(Math.round(this.percentage)) + '%';
    }
    /**
     * Set the progress bar message
     * @method setMessage
     * @param {string} message - message to be displayed with the progressbar
     * @param {Object} args - arguments for message
     */
    setMessage(message, args) {
        this.message = this.createMessage(message, args);
        fw.emptyNode(this.infoNodeText);
        this.infoNode.appendChild(document.createTextNode(this.message));

        this.infoNode.style.marginLeft = this.infoNode.offsetWidth > this.progressbarNode.offsetWidth ?
            '-' + String((this.infoNode.offsetWidth - this.progressbarNode.offsetWidth) / 2) + 'px' :
            '';           
    }
    /**
     * Get the progress bar message
     * @method getMessage
     * @return {fw/i18n/Message}
     */
    getMessage() {
        return this.message;
    }   
    /**
     * Show the progressbar
     * @method show
     */
    show() {
        if (currentProgressBar) {
            if (currentProgressBar !== this) {
                currentProgressBar.hide();
            } else {
                return;
            }
        }

        currentProgressBar = this;

        super.show();
    }
    /**
     * Hide the progressbar
     * @method hide
     */
    hide() {
        if (!currentProgressBar) return;

        currentProgressBar = null;
        super.hide();
    }
    /**
     * Repaint the progressbar
     * @method repaint
     * @private
     */
    repaint() {
        this.node.style.width = this.width;
        this.node.style.height = this.height;
        this.node.style.marginLeft = '-' + String(this.node.offsetWidth / 2) + 'px';
        this.node.style.marginTop = '-' + String(this.node.offsetHeight / 2) + 'px';
    }
}

module.exports = FwProgressBar;
