/**
 * @module fw/Core
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var dom = require('./dom');
var initialize = require('./initialize');
var ElementFactory = require('./ui/ElementFactory');
var FwElement = require('./ui/Element');
var FwNode = require('./ui/Node');
var format = require('./format');
var Store = require('./ui/Store');
var types = require('./types');
var utils = require('./utils');

var key, funcs, fw;

// Merge core libraries into fw namespace 
var fw = function(arg, config) {
    if (arg instanceof Node || arg instanceof FwElement) {
        return new FwNode(arg);
    } else if (!fw.isEmptyString(arg)) {
        if (arg.indexOf('-') === -1) {
            return new FwNode(document.createElement(arg));
        } else {
            return new ElementFactory.createElement(arg, config);
        }
    }
};
// Functions to integrated;
var funcs = utils.extendObject({
    createStore: function() { 
        return new Store(); 
    }
}, dom, types, utils, format, ElementFactory);

for (key in funcs) {
    Object.defineProperty(fw, key, { value: funcs[key] });
}

window.fw = fw;

module.exports = fw;
