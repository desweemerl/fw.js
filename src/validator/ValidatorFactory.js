/**
 * @module fw/validator/validator
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var CheckValidator = require('./CheckValidator');
var ModuleError = require('../error/ModuleError');
var NumberValidator = require('./NumberValidator');
var RequiredValidator = require('./RequiredValidator');
var Validator = require('./Validator');

// Registered validators
var registeredValidators = [CheckValidator, NumberValidator, RequiredValidator];

var ValidatorFactory = {
    /**
     * Get validators from an instance or a objecturation object
     * @function getValidators
     * @param {Object} [object] - the objecturation object parameter
     * @param {fw/validator/RequiredValidator} [object.requiredValidator] - add a required validator to the validator manager
     * @param {boolean|function} [object.required] - create a required validator with this parameter and add it to the validator manager
     * @param {fw/validator/CheckValidator} [object.checkValidator] - add a check validator to the validator manager
     * @param {function} [object.check] - create a check validator with this parameter and add it to the validator manager
     * @param {fw/validator/NumberValidator} [object.numberValidator] - add a number validator to the validator manager
     * @param {number|function|fw/type/Currency|fw/type/Number|fw/type/Integer} [object.minValue] - create a number validator with this parameter and add it to the validator manager
     * @param {number|function|fw/type/Currency|fw/type/Number|fw/type/Integer} [object.maxValue] - create a number validator with this parameter and add it to the validator manager
     * @param {boolean|function} [object.positive] - create a number validator with this parameter and add it to the validator manager
     * @return {Object} validators
     */
    getValidators: function(object) {
        var validators = [];
        var validator;
        var n, l;

        for (n = 0, l = registeredValidators.length; n < l; n++) {
            validator = registeredValidators[n].getValidator(object);
            
            if (validator) {
                validators.push(validator);
            }
        }

        return validators;
    },
    /**
     * Register a validator
     * @function registerValidator
     * @param {fw/validator/Validator} validator - validator to be registered
     */
    registerValidator: function(validator) {
        if (!(validator instanceof Validator)) {
            throw new ModuleError({
                moduleName: 'fw/validator/ValidatorFactory',
                message:    'specified validator is not an instance of fw/validator/Validator',
                origin:     '"registerValidator" function'
            });
        }

        if (registeredValidators.indexOf(validator) !== -1) {
            throw new ModuleError({
                moduleNAme: 'fw/validator/ValidatorFactory',
                message:    'validator "' + validator.constructor.name + '" is already registered',
                origin:     '"registerValidator" function'
            }); 
        }

        registeredValidators.push(validator);
    },
    /**
     * Check if a validator is already registered
     * @function isValidatorRegistered
     * @param {fw/validator/Validator} validator
     * @return {boolean}
     */
    isValidatorRegistered: function(validator) {
        return registeredValidators[validator] !== -1; 
    },
    /**
     * Get the first error of value validation
     * @function getFirstError
     * @param {Array} validators - validators used for the value validation
     * @param {*} value - value to be validated
     * @param {Object} [context = this] - context for the validators
     * @return {Object} error messages
     */
    getFirstError: function(validators, value, context) {
        validators = validators || [];

        var output, key, error;
        var n, l;

        for (n = 0, l = validators.length; n < l; n++) {
            output = validators[n].validate(value, context);

            for (key in output) {
                error = output[key];
                if (error) return error;
            }  
        }

        return null;
    }
};

module.exports = ValidatorFactory;
