/**
 * @module fw/ui/desktop/window/ConfirmationWindowModal
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var ElementError = require('../../error/ElementError');
var fw = require('../../Core');
var i18nWindowModal = require('../../nls/windowmodal');
var WindowModal = require('./WindowModal');

/**
 * Create a confirmation window modal
 * @function
 * @alias module:fw/ui/window/ConfirmationWindowModal
 * @param {Object} [config] - the configuration object of the window modal
 * @param {number} [config.message] - set the message of the configuration window modal
 * @param {string} [config.title] - set the confirmation window modal title
 * @param {function} [config.onConfirm] - triggered when the user accepts the message
 */
module.exports = function(config) {
    var ConfirmationWindowModal, contentNode;

    config = config || {};

    if (!fw.isString(config.message)) {
        throw new ElementError({
            elementName: 'ConfirmationWindowModal',
            message:     'property "message" must be defined',
            origin:      'onBeforeBuildUI function'
        });
    }

    if (!fw.isFunction(config.onConfirm)) {
        throw new ElementError({
            elementName: 'ConfirmationWindowModal',
            message:     'property "onConfirm" must be defined',
            origin:      'onBeforeBuildUI function'
        });
    }

    contentNode = document.createElement('div');
    fw(contentNode).html('<table>\
            <tr>\
                <td><fw-label name="message" formatHTML="true"></fw-label></td>\
            </tr>\
            <tr class="actions">\
                <td><fw-button name="confirm">windowmodal.confirm</fw-button><fw-button name="cancel">windowmodal.cancel</fw-button></td>\
            </tr>\
        </table>',
        {
            i18n: config.i18n ? [i18nWindowModal, config.i18n] : i18nWindowModal
        },
        {
            message: {
                value: config.message
            },
            confirm: {
                onClick: function () {
                    config.onConfirm();
                    ConfirmationWindowModal.destroy();
                }
            },
            cancel: {
                onClick: function () {
                    ConfirmationWindowModal.destroy();
                }
            }
        });

    ConfirmationWindowModal = new WindowModal({
        title:       config.title || 'windowmodal.confirm',
        contentNode: contentNode
    });

    ConfirmationWindowModal.show();
};
