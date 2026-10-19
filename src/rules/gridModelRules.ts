import { body } from 'express-validator';

/**
 * Regole di validazione per la creazione di un modello a griglia.
 *
 * Verifica la presenza e il tipo dei campi obbligatori
 * e controlla che la matrice contenga righe non vuote
 * con valori interi pari a 0 oppure 1.
 */
export const createModelRules = [

    // L'identificativo logico del modello è obbligatorio e deve essere una stringa.
    body('modelId')
        .notEmpty()
        .withMessage('modelId is required')
        .isString()
        .withMessage('modelId must be a string'),

    // Il nome del modello è obbligatorio e deve essere una stringa.
    body('name')
        .notEmpty()
        .withMessage('name is required')
        .isString()
        .withMessage('name must be a string'),

    // La matrice deve essere un array contenente almeno una riga.
    body('matrix')
        .notEmpty()
        .withMessage('matrix is required')
        .isArray({ min: 1 })
        .withMessage('matrix must be a non-empty array'),

    // Ogni riga della matrice deve essere un array non vuoto.
    body('matrix.*')
        .isArray({ min: 1 })
        .withMessage('Each matrix row must be a non-empty array'),

    // Ogni cella della matrice deve contenere il valore intero 0 oppure 1.
    body('matrix.*.*')
        .isInt({ min: 0, max: 1 })
        .withMessage('Matrix values must be 0 or 1'),
];
