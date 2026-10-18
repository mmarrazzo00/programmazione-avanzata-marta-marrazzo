import { Request, Response, NextFunction } from 'express';
import { HttpError } from './errorHandler.js';

/**
 * Middleware che controlla i parametri della query string.
 *
 * Consente esclusivamente i parametri specificati in allowedParams
 * e segnala eventuali parametri non previsti con un errore HTTP 400.
 *
 * @param allowedParams - Elenco dei parametri di query consentiti.
 */
export const validateQueryParams = (
    allowedParams: string[]
) => {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ): void => {
        // Recupera i nomi dei parametri presenti nella query string.
        const receivedParams = Object.keys(req.query);

        // Individua i parametri che non appartengono all'elenco consentito.
        const unexpectedParams = receivedParams.filter(
            param => !allowedParams.includes(param)
        );

        // Rifiuta la richiesta se contiene parametri non previsti.
        if (unexpectedParams.length > 0) {
            return next(
                new HttpError(
                    400,
                    `Unexpected query parameters: ${unexpectedParams.join(', ')}`
                )
            );
        }

        // Se tutti i parametri sono consentiti, prosegue l'elaborazione.
        next();
    };
};
