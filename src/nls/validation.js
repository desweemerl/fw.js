'use strict';

var dict = {
    default: {
        validator: {
            required:               'Field required',
            minValue:               'Value below {minValue}',
            maxValue:               'Value exceeds {maxValue}',
            positive:               'Value must be positive',
            invalid:                'Invalid field'
        }
    },
    fr: {
        validator: {
            required:               'Champs manquant',
            minValue:               'Valeur inférieure à {minValue}',
            maxValue:               'Valeur supérieure à {maxValue}',
            positive:               'La valeur doit être positive',
            invalid:                'Champ invalide'
        }
    }
};

module.exports = dict;
