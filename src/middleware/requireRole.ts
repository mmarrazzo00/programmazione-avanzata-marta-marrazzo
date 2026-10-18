import { Request, Response, NextFunction } from 'express';
import { HttpError } from './errorHandler.js';

/**
 * Middleware di autorizzazione basato sul ruolo dell'utente.
 *
 * Restituisce un middleware che verifica se l'utente
 * autenticato possiede il ruolo richiesto per accedere
 * alla risorsa.
 *
 * @param role - Ruolo necessario per accedere all'endpoint.
 */
export function requireRole(role: string) {
    return (
        req: Request,
        _res: Response,
        next: NextFunction
    ): void => {

        // Verifica che l'utente sia stato autenticato.
        // In caso contrario, restituisce un errore HTTP 401.
        if (!req.user) {
            next(new HttpError(401, 'User not authenticated'));
            return;
        }

        // Controlla che il ruolo dell'utente corrisponda
        // a quello richiesto per accedere alla risorsa.
        if (req.user.role !== role) {
            next(new HttpError(403, 'Forbidden'));
            return;
        }

        // Autorizza il proseguimento della richiesta.
        next();
    };
}