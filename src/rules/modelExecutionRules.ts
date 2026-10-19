import { body, param } from 'express-validator';

/**
 * Regole di validazione per l'esecuzione di un modello a griglia.
 *
 * Verifica la presenza dell'identificativo del modello
 * e la struttura delle coordinate di partenza e destinazione.
 *
 * Le coordinate devono essere rappresentate da oggetti
 * contenenti indici di riga e colonna interi non negativi.
 */
export const modelExecutionRules = [

    // L'identificativo del modello deve essere presente nella rotta.
    param('modelId')
        .notEmpty()
        .withMessage('modelId is required'),

    // Il punto di partenza deve essere rappresentato da un oggetto.
    body('start')
        .isObject()
        .withMessage('start must be an object'),

    // La riga iniziale deve essere un intero non negativo.
    body('start.row')
        .isInt({ min: 0 })
        .withMessage('start.row must be a non-negative integer'),

    // La colonna iniziale deve essere un intero non negativo.
    body('start.column')
        .isInt({ min: 0 })
        .withMessage('start.column must be a non-negative integer'),

    // Il punto di destinazione deve essere rappresentato da un oggetto.
    body('goal')
        .isObject()
        .withMessage('goal must be an object'),

    // La riga finale deve essere un intero non negativo.
    body('goal.row')
        .isInt({ min: 0 })
        .withMessage('goal.row must be a non-negative integer'),

    // La colonna finale deve essere un intero non negativo.
    body('goal.column')
        .isInt({ min: 0 })
        .withMessage('goal.column must be a non-negative integer')
];
