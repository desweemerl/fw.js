/**
 * @module fw/ui/form/EditableFormElement
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var FocusableFormElement = require('./FocusableFormElement');
var fw = require('../../Core');
var I18n = require('../../i18n/I18n');
var i18nForm = require('../../nls/form');
var Notification = require('../component/Notification');
var ValidatorFactory = require('../../validator/ValidatorFactory');
var RequiredValidator = require('../../validator/RequiredValidator');

// Add i18nForm default dictionary
I18n.addDictionary('i18nForm', i18nForm);

/**
 * EditableFormElement brings validation and error messaging features to FocusableFormElement
 * @class
 * @alias module:/fw/ui/form/EditableFormElement
 * @augments fw/ui/form/FocusableFormElement
 * @param {Object} config - the configuration object parameter
 * @param {boolean} [config.disabled] - disable the form element
 * @param {fw/source/DataSource} [config.dataSource] - dataSource to bind
 * @param {string} [config.property] - element property
 * @param {function} [config.check] - function(this.value) a check function called during validation
 */
class EditableFormElement extends FocusableFormElement {
    /**
     * Initialize the UI element
     * @method initialize
     * @private
     */
    initialize() {
        // Add error checking to the EditableFormElement
        this.dataSourceRefreshing = false;
        this.invalid = false;
        this.errorMessage = null;
        // Add dictionary to the EditableFormElement
        this.elementI18n = 'i18nForm';   
        // Add onChange callback
        this.onChange = this.config.onChange || this.onChange || null;
        // Add a check function called during validation
        this.check = this.config.check || this.check || null;       
    }
    /**
     * Refresh the DataSource if defined
     * @method refreshDataSource
     * @private
     */
    refreshDataSource() {
        if (this.dataSource && !this.sync) {
            this.dataSource.source.set(this.property, this.value);
        }
    }
    /**
     * Validate the EditableFormElement
     * @method validate
     * @return {boolean}
     */
    validate() {
        var validators, errors, error;

        if (this.dataSource) {
            errors = this.dataSource.source.getErrorMessages(this.property);

            if (errors.length > 0) {
                error = errors[0];
            }
        } else {
            validators = ValidatorFactory.getValidators(this);
            error = ValidatorFactory.getFirstError(validators, this.value, this);
        }

        if (error) {
            this.setError(error);
            return false;
        }

        if (fw.isFunction(this.check)) {
            error = this.check(this.value);

            if (error !== undefined) {
                this.setError(error);
                return false;
            }
        }
        this.reset();

        return true;
    }
    /**
     * Display an error message
     * @private
     * @method displayError
     */
    displayError() {
        var notification;

        if (this.invalid && this.errorMessage !== null) {
            this.errorMessage.addI18n(this.i18n);
            notification = new Notification({ error: true, message: this.errorMessage });
            notification.show();
        }
    }
    /**
     * Attach an error to the EditableFormElement
     * @method setError
     * @param {string|fw/i18n/Message} message - error message to be attached
     */
    setError(message) {
        this.invalid = true;
        this.addClass('invalid');
        this.errorMessage = message;
        this.emitEvent('invalid', this.node);
    }
    /**
     * Reset the EditableFormElement (remove the error)
     * @private
     * @method reset
     */
    reset() {
        if (!this.invalid) return;

        this.invalid = false;
        this.errorMessage = null;
        this.removeClass('invalid');
    }
    /**
     * Trigger a detach event with a reset of the EditableFormElement
     * @method triggerDetach
     */
    triggerDetach() {
        this.reset();
        super.triggerDetach();
    }
}

module.exports = EditableFormElement;
