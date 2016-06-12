'use strict';

var dict = {
    default: {
          badGateway:             'Bad gateway',
          requestAborted:         'Request aborted',
          requestErroneous:       'Request erroneous',
          connectionRefused:      'Connection refused',
          requestTimeout:         'Request timeout',
          methodNotAllowed:       'Method not allowed',
          serviceUnavailable:     'Service unavailable',
          notFound:               'Resource not found',
    },
    fr: {
          badGateway:             'Passerelle incorrecte',
          requestAborted:         'Requête annulée',
          requestErroneous:       'Requête erronée',
          connectionRefused:      'Connexion refusée',
          requestTimeout:         'Arrêt de requête',
          methodNotAllowed:       'Methode non permise',
          serviceUnavailable:     'Service indisponible',
          notFound:               'Resource non trouvée',
    }
};

module.exports = dict;
