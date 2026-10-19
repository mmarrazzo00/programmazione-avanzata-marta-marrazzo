/**
 * Definisce i metadati dell'utente autenticato
 * contenuti nel payload del token JWT.
 */
export interface UserPayload {
    userId: number;
    username: string;
    role: string;
}

/**
 * Estende globalmente i tipi di Express
 * aggiungendo la proprietà user all'interfaccia Request.
 *
 * La proprietà è opzionale perché non tutte le richieste
 * HTTP richiedono autenticazione.
 */
declare global {
    namespace Express {
        interface Request {
            user?: UserPayload;
        }
    }
}
