import dotenv from 'dotenv';
import fs from 'fs';
import jwt from 'jsonwebtoken';

// Carica le variabili d'ambiente necessarie alla configurazione JWT.
dotenv.config();

// Recupera il percorso della chiave privata RSA dal file .env.
const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;

// Impedisce la generazione dei token se il percorso non è configurato.
if (!privateKeyPath) {
    throw new Error('JWT_PRIVATE_KEY_PATH is not defined');
}

// Legge la chiave privata utilizzata per firmare i token JWT.
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

/**
 * Definisce i metadati dell'utente inseriti nel payload JWT.
 *
 * Non include dati sensibili, come password o saldo dei crediti.
 */
export interface UserPayload {
    userId: number;
    username: string;
    role: string;
}

/**
 * Genera un token JWT firmato con la chiave privata RSA.
 *
 * @param payload - Metadati dell'utente autenticato.
 * @returns Token JWT firmato con algoritmo RS256,
 *          valido per un'ora.
 */
export function generateToken(payload: UserPayload): string {
    return jwt.sign(payload, privateKey, {
        algorithm: 'RS256',
        expiresIn: '1h'
    });
}