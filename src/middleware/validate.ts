import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { HttpError } from './errorHandler.js';

/**
 * Middleware che verifica l'esito delle validazioni
 * eseguite da express-validator sulla richiesta HTTP.
 *
 * In presenza di errori, genera un HttpError 400
 * contenente i dettagli delle validazioni fallite.
 */
export function validate(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Inoltra gli errori al middleware globale errorHandler.
        next(
            new HttpError(
                400,
                'Validation error',
                errors.array()
            )
        );
        return;
    }
    
    // Se la richiesta è valida, passa al middleware o controller successivo.
    next();
}