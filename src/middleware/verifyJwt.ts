import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { HttpError } from './errorHandler.js';

// Carica le variabili d'ambiente.
dotenv.config();

// Recupera il percorso della chiave pubblica RSA.
const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH;

// Verifica che il percorso della chiave sia configurato.
if (!publicKeyPath) {
    throw new Error('JWT_PUBLIC_KEY_PATH is not defined');
}

// Legge la chiave pubblica utilizzata per verificare i JWT.
const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

/**
 * Middleware di autenticazione JWT.
 *
 * Estrae il token dall'header Authorization, ne verifica
 * la firma e la validità tramite la chiave pubblica RSA
 * e rende disponibili i metadati dell'utente in req.user.
 *
 * In caso di errore, delega la gestione al middleware globale.
 */
export function verifyJwt(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    try {
        // Recupera l'header Authorization dalla richiesta HTTP.
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new HttpError(401, 'Authorization header missing');
        }

        // Verifica che l'autenticazione utilizzi lo schema Bearer.
        const [type, token] = authHeader.split(' ');

        if (type !== 'Bearer' || !token) {
            throw new HttpError(401, 'Invalid authorization format');
        }

        // Verifica firma e scadenza del token tramite la chiave pubblica.
        // Sono accettati esclusivamente token firmati con RS256.
        const decoded = jwt.verify(token, publicKey, {
            algorithms: ['RS256']
        });

        // Memorizza i metadati dell'utente autenticato nella richiesta.
        req.user = decoded as {
            userId: number;
            username: string;
            role: string;
        };

        // Consente il passaggio ai middleware o al controller successivi.
        next();
    } catch (error) {
        // Inoltra gli errori al middleware centralizzato errorHandler.
        next(error);
    }
}