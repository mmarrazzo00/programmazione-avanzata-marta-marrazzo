import { body, param, query } from 'express-validator';

/**
 * Regole di validazione per la creazione di una richiesta
 * di aggiornamento di un modello a griglia.
 *
 * Verifica l'identificativo del modello e la struttura
 * dell'array di modifiche proposte.
 */
export const createUpdateRequestRules = [

    // L'identificativo del modello deve essere presente nella rotta.
    param('modelId')
        .notEmpty()
        .withMessage('modelId is required')
        .isString()
        .withMessage('modelId must be a string'),

    // Il body deve essere un array contenente almeno una modifica.
    body()
        .isArray({ min: 1 })
        .withMessage('updates must be a non-empty array'),

    // Ogni modifica deve indicare una riga con indice non negativo.
    body('*.row')
        .isInt({ min: 0 })
        .withMessage('row must be a non-negative integer'),

    // Ogni modifica deve indicare una colonna con indice non negativo.
    body('*.column')
        .isInt({ min: 0 })
        .withMessage('column must be a non-negative integer'),

    // Il nuovo valore proposto per ogni cella deve essere 0 oppure 1.
    body('*.newValue')
        .isInt({ min: 0, max: 1 })
        .withMessage('newValue must be 0 or 1'),
];

/**
 * Regole di validazione per la decisione complessiva
 * su una richiesta di aggiornamento.
 *
 * Verifica l'identificativo della richiesta e richiede
 * una decisione booleana di accettazione o rifiuto.
 */
export const updateRequestDecisionRules = [

    // L'identificativo della richiesta deve essere un intero positivo.
    param('requestId')
        .isInt({ min: 1 })
        .withMessage('requestId must be a positive integer'),

    // Il campo accept deve essere un booleano: true oppure false.
    body('accept')
        .custom(value => typeof value === 'boolean')
        .withMessage('accept must be a boolean')
];

/**
 * Regole di validazione per la consultazione dello storico
 * delle richieste di aggiornamento di un modello.
 *
 * Supporta filtri opzionali per intervallo temporale,
 * stato della richiesta e tipo di data utilizzato.
 */
export const updateHistoryRules = [

    // Verifica la presenza dell'identificativo del modello.
    param('modelId')
        .isString()
        .notEmpty()
        .withMessage('modelId is required'),

    // Data iniziale opzionale nel formato ISO 8601.
    query('FROM')
        .optional()
        .isISO8601()
        .withMessage('FROM must be a valid ISO 8601 date'),

    // Data finale opzionale nel formato ISO 8601.
    query('TO')
        .optional()
        .isISO8601()
        .withMessage('TO must be a valid ISO 8601 date'),

    // Consente di filtrare le richieste in base allo stato.
    query('STATUS')
        .optional()
        .isIn(['accepted', 'rejected', 'pending', 'auto','split'])
        .withMessage(
            'STATUS must be accepted, rejected, pending, auto or split'
        ),

    // Seleziona il campo temporale da utilizzare per il filtro.
    query('DATE_TYPE')
        .optional()
        .isIn(['createdAt', 'updatedAt'])
        .withMessage(
            'DATE_TYPE must be createdAt or updatedAt'
        )
];

/**
 * Regole di validazione per la consultazione dello stato
 * delle richieste pending associate a un modello.
 *
 * Verifica che l'identificativo del modello non sia vuoto,
 * eliminando eventuali spazi iniziali e finali.
 */
export const modelPendingStatusRules =
[ param('modelId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('modelId is required') ];
