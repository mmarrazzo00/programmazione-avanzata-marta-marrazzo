
import { body } from 'express-validator';

/**
 * Regole di validazione per la richiesta di autenticazione.
 *
 * Verifica la presenza e il formato dell'email
 * e richiede che venga fornita una password.
 */
export const authRules = [
    // L'email è obbligatoria e deve rispettare un formato valido.
    body('email')
        .notEmpty()
        .withMessage('Email is required')
        .bail()
        .isEmail()
        .withMessage('Invalid email'),

    // La password deve essere presente e non vuota.
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
];
