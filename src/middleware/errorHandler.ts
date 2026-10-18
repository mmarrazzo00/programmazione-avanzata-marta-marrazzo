import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Classe personalizzata per rappresentare gli errori HTTP applicativi.
 *
 * Permette di associare a un errore un codice di stato HTTP
 * e, facoltativamente, informazioni aggiuntive.
 */
export class HttpError extends Error {
    status: number;
    details?: unknown;

    constructor(
        status: number,
        message: string,
        details?: unknown
    ) {
        super(message);
        this.status = status;
        this.details = details;

        Object.setPrototypeOf(this, HttpError.prototype);
    }
}

/**
 * Middleware che gestisce le richieste verso endpoint inesistenti,
 * restituendo una risposta HTTP 404.
 */
export function notFound(
    _req: Request,
    res: Response
): void {
    res.status(404).json({
        error: 'Resource not found'
    });
}

/**
 * Middleware globale per la gestione centralizzata degli errori.
 *
 * Distingue gli errori applicativi, gli errori di autenticazione JWT
 * e gli errori imprevisti, restituendo risposte JSON appropriate.
 *
 * Viene registrato dopo le rotte e il middleware notFound.
 */
export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {

    // Gestisce gli errori applicativi utilizzando il codice HTTP
    // specificato nella classe HttpError.
    if (err instanceof HttpError) {
        res.status(err.status).json({
            error: err.message,
            ...(err.details !== undefined && {
                details: err.details
            })
        });
        return;
    }

    // Restituisce HTTP 401 quando il token JWT è scaduto.
    if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({
            error: 'Token expired'
        });
        return;
    }

    // Restituisce HTTP 401 quando il token JWT non è valido.
    if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
            error: 'Invalid token'
        });
        return;
    }

    // Registra gli errori non previsti per facilitarne la diagnosi.
    console.error('Unhandled error:', err);

    // Restituisce HTTP 500 senza esporre dettagli interni del server.
    res.status(500).json({
        error: 'Internal server error'
    });
}