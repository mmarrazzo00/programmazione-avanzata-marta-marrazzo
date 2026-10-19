import { body } from 'express-validator';

/**
 * Regole di validazione per la registrazione di un nuovo utente.
 *
 * Verifica che username ed email siano validi e che
 * la password contenga almeno 6 caratteri.
 */
export const createUserRules = [

    // Lo username deve essere una stringa non vuota.
    body('username')
        .isString()
        .withMessage('Username must be a string')
        .bail()
        .notEmpty()
        .withMessage('Username is required'),

    // L'email deve rispettare un formato valido.
    body('email')
        .isEmail()
        .withMessage('Invalid email')
        .bail()
        .notEmpty()
        .withMessage('Email is required'),

    // La password deve contenere almeno 6 caratteri.
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
];

/**
 * Regole di validazione per la modifica dei dati di un utente.
 *
 * Tutti i campi sono opzionali, poiché una richiesta PATCH
 * può modificare soltanto alcuni attributi.
 *
 * Se presenti, i valori devono rispettare i vincoli definiti.
 */
export const updateUserRules = [

    // Se fornito, lo username deve essere una stringa non vuota.
    body('username')
        .optional()
        .isString()
        .withMessage('Username must be a string')
        .bail()
        .notEmpty()
        .withMessage('Username is required'),

    // Se fornita, l'email deve avere un formato valido.
    body('email')
        .optional()
        .isEmail()
        .withMessage('Invalid email'),

    // Se fornita, la password deve contenere almeno 6 caratteri.
    body('password')
        .optional()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),

    // Il ruolo può assumere esclusivamente i valori user o admin.
    body('role')
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('Invalid role'),
];

/**
 * Regole di validazione per l'aggiornamento dei crediti.
 *
 * Verifica la validità dell'email e richiede
 * un importo numerico non negativo.
 */
export const updateCreditRules = [

    // Identifica l'utente attraverso un indirizzo email valido.
    body('email')
        .isEmail()
        .withMessage('Invalid email'),

    // La variazione di credito deve essere maggiore o uguale a zero.
    body('credit')
        .isFloat({ min: 0 })
        .withMessage('Credit must be a non-negative number')
];
