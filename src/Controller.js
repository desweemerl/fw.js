/**
 * @module lib/Controller
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var Application = require('./Application');
var ElementFactory = require('fw/ui/ElementFactory');
var FwPromise = require('fw/Promise');
var FwSearchList = require('fw/ui/form/SearchList');
var Loader = require('fw/net/Loader');
var Model = require('fw/Model');
var Translator = require('fw/i18n/Translator');
var utils = require('fw/utils');

ElementFactory.registerElement(FwSearchList);

/**
 * The lib/MyController class is the base controller
 *
 * @class
 * @alias module:lib/Controller
 * @param {Object} config - The configuration object parameter
 * @param {lib/MyController} [parentController] - The parent controller for which the controller will be attached
 */
class Controller {
    /**
     * Load controller
     * @method load
     * @static
     * @abstract
     * @return {fw/Promise}
     */
    static load() {
        var classLoaders = this.loaders;
        var loaders = this.Model && this.Model.prototype instanceof Model ? [this.Model.load()] : [];
        var n, l, loader;

        if (classLoaders instanceof Array) {
            for (n = 0, l = classLoaders.length; n < l; n++) {
                loader = classLoaders[n];

                if (loader instanceof FwPromise) {
                    loaders.push(loader);
                }
            }
        }

        return FwPromise.all(loaders);
    }
    /**
     *
     */ 
    static loadHtml(options) {
        options = options || {};
        options.timeout = Application.netTimeout || options.timeout;       

        return Loader.loadHtml(options);
    }   
    /**
     * @constructor
     */
    constructor(config) {
        var self = this;

        this.config = config || {};   

        Translator.call(this, config);

        // If a model is defined, then create an instance of it
        if (this.constructor.Model && this.constructor.Model.prototype instanceof Model) {
            this.modelInstance = new this.constructor.Model();
        } else if (this.config.modelInstance instanceof Model) {
            this.modelInstance = this.config.modelInstance;
        }

        this.initialize();
    }
    /**
     * Called when the object is instantiated
     * @abstract
     * @method initialize
     */
    initialize() {}
    /**
     * Called before the controller destuction
     * @abstract
     * @method onBeforeDestory
     */
    onBeforeDestroy() {}        
    /**
     * Called after the controller destuction
     * @abstract
     * @method initialize
     */
    onAfterDestroy() {}        
    /**
     * Abort all requests from the model and destroy controller template and children controllers
     * @method destroy
     */
    destroy() {      
        // Call onBeforeDestroy
        this.onBeforeDestroy();
        // Abort all requests from the model
        if (this.modelInstance) {
            this.modelInstance.abortAll();            
        }
        // Call onAfterDestroy
        this.onAfterDestroy();
    }        
}

utils.extendObject(Controller.prototype, Translator.prototype);

module.exports = Controller;
