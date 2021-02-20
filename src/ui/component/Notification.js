/**
 * @module fw/ui/component/Notification
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var fw = require('../../Core');
var FwElement = require('../Element');
var FwNumber = require('../../type/Number');
var I18n = require('../../i18n/I18n');
var Message = require('../../i18n/Message');

var STATE_PENDING_SHOW = 0;
var STATE_SHOW = 1;
var STATE_HIDE = 2;

var notifications = [];
var eventsActive = false;
var mouseX, mouseY;

// Acticate windows events
function activateEvents() {
    if (notifications.length !== 0 && !eventsActive) {
        eventsActive = true;
        window.addEventListener('mousemove', onMouseMove, false);
        window.addEventListener('mousedown', onMouseDown, false);
    }
}
// Deactivate windows events
function deactivateEvents() {
    if (eventsActive) {
        eventsActive = false;
        window.removeEventListener('mousemove', onMouseMove, false);
        window.removeEventListener('mousedown', onMouseDown, false);
    }
}
// Manage onMouseDown event
function onMouseDown() {
    if (notifications.length === 0 || notifications[0].state !== STATE_SHOW) return;
    notifications[0].state = STATE_HIDE;
}
// Manage onMouseMove event
function onMouseMove(e) {
    if (notifications.length === 0 || notifications[0].state !== STATE_SHOW) return;

    if (mouseX === undefined) {
        mouseX = e.pageX;
        mouseY = e.pageY;
    } else if (Math.abs(mouseX - e.pageX) > 20 || Math.abs(mouseY - e.pageY) > 20) {
        mouseX = mouseY = undefined;
        notifications[0].state = STATE_HIDE;
    }
}
// Refresh notifications
function refreshView() {
    var notification, node, opacity;

    if (notifications.length === 0) return;
    notification = notifications[notifications.length - 1];
    node = notification.node;

    if (notifications.length > 1) {
        while (notifications[0] !== notification) {
            if (opacity === undefined && notifications[0].state !== STATE_PENDING_SHOW) {
                opacity = new FwNumber(notifications[0].opacity);
            }
            notifications[0].hide();
        }
        notifications.opacity = opacity;
    }

    node.style.zIndex = '200000';

    switch (notification.state) {
        case STATE_PENDING_SHOW:
            node.style.marginLeft = String(-node.offsetWidth / 2) + 'px';
            notification.state = STATE_SHOW;
            break;
        case STATE_SHOW:
            if (notification.opacity.getNumber() < 1) {
                notification.opacity = notification.opacity.add(0.1);
                if (notification.opacity.getNumber() <= 1) {
                    node.style.opacity = notification.opacity.toString({ precision: 2 });
                    break;
                }

                notification.opacity.setNumber(1);
                node.style.opacity = '1';
                activateEvents();
            }
            break;
        case STATE_HIDE:
            deactivateEvents();

            if (notification.hidingTimer === null) {
                notification.hidingTimer = Date.now();
            } else if ((Date.now() - notification.hidingTimer) > notification.duration) {
                if (notification.opacity.getNumber() > 0) {
                    notification.opacity = notification.opacity.substract(0.1);
                    if (notification.opacity.getNumber() >= 0) {
                        node.style.opacity = notification.opacity.toString({ precision: 2 });
                        break;
                    }
                }

                notification.opacity.setNumber(0);
                node.style.opacity = '0';
                notification.hide();
            }
            break;
    }

    if (notifications.length !== 0) {
        window.setTimeout(refreshView, 5);
    }
}

/**
 * Create a notification UI element
 * @class
 * @alias module:fw/ui/component/Notification
 * @augments fw/ui/Element
 * @param {Object} config - the configuration object parameter
 * @param {string|fw/i18n/Message} config.message - message to be notified
 * @param {Object} [config.args] - arguments to be injected to the message
 * @param {boolean} [config.error=false] - set a notification error
 * @param {number} [config.duration=1000] - notification display duration in milliseconds
 */
class FwNotification extends FwElement {
    /**
     * Define element tagName
     * @property tagName
     */
    static tagName = 'fw-notification'; // jshint ignore:line
    /**
     * Define element className
     * @property className
     */
    static className = 'fw-notification'; // jshint ignore:line
    /**
     * Clear all messages
     * @method cleara
     * @static
     */
    static clear() {
        while (notifications.length > 0) {
            notifications[0].hide();
        }
    }
    /**
     * Initialize the notification UI element
     * @method initialize
     * @private
     */
    initialize() {
        this.message = null;
        this.configMessage = this.config.message || null;
        this.error = this.config.error || false;
        this.duration = this.config.duration || 1000;
        this.hidingTimer = null;
        this.state = STATE_PENDING_SHOW;
        this.opacity = new FwNumber(0);
    }
    /**
     * Process the node config
     * @method processNode
     * @private
     */
    processNode(node) {
        var child = node.firstChild;

        if (child !== null && child.nodeType === 3 && child.nodeValue.trim().length > 0) {
            this.configMessage = child.nodeValue;
        }
    }
    /**
     * Build UI element nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node.style.opacity = '0';
        this.setMessage(this.configMessage, this.config.args);

        if (this.error) {
            this.node.classList.add('error');
        }
    }
    /**
     * Bind UI element node
     * @method bindUI
     * @private
     */
    bindUI() {
        this.onAttributeChange('error', this.setError);
    }
    /**
     * Trigger attach event. Show method is called
     * @method triggerAttach
     * @private
     */
    triggerAttach() {
        this.show();
        super.triggerAttach();
    }
    /**
     * Trigger a detach event. Hide method is called
     * @method triggerDetach
     * @private
     */
    triggerDetach() {
        this.hide();
        super.triggerDetach();
    }
    /**
     * Show a notification
     * @method show
     */
    show() {
        if (notifications.indexOf(this) !== -1) return;

        notifications.push(this);

        if (this.node.parentNode === null) {
            document.body.appendChild(this.node);
        }
        this.node.style.opacity = '1';
        refreshView();
    }
    /**
     * Hide a notification
     * @method hide
     */
    hide() {
        var index;

        if ((index = notifications.indexOf(this)) === -1) return;
        notifications.splice(index, 1);

        if (this.node.parentNode !== null) {
            this.node.parentNode.removeChild(this.node);
        }
    }
    /**
     * Set error on a notification
     * @method setError
     * @param {boolean} error - display error
     */
    setError(error) {
        this.error = !fw.isString(error) ? error === 'true' : !!error;

        if (this.error) {
            this.node.classList.add('error');
        } else {
            this.node.classList.remove('error');
        }
    }
    /**
     * Set the notification message
     * @method setMessage
     * @param {string|fw/i18n/Message} message - notification message
     * @param {Object} args - arguments for message
     */
    setMessage(message, args) {
        this.message = message instanceof Message ? message : this.createMessage(message, args);
        fw.emptyNode(this.node);
        this.node.appendChild(document.createTextNode(this.message));
    }
    /**
     * Get the notification message
     * @method getMessage
     * @return {fw/i18n/Message}
     */
    getMessage() {
        return this.message;
    }
}

module.exports = FwNotification;
