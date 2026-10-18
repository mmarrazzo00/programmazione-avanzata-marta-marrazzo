import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService.js';

/**
 * Controller responsabile dell'autenticazione degli utenti.
 *
 * Riceve le credenziali dalla richiesta HTTP e delega
 * la verifica e la generazione del token JWT ad AuthService.
 */
export class AuthController {

    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    /**
     * Gestisce la richiesta di login.
     *
     * Estrae email e password dal body, richiede al Service
     * l'autenticazione e restituisce il token JWT generato.
     *
     * Eventuali errori vengono inoltrati al middleware
     * globale di gestione degli errori tramite next(error).
     */
    async login(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const { email, password } = req.body;

            const token = await this.authService.login(
                email,
                password
            );

            // Restituisce il token JWT in caso di autenticazione riuscita.
            res.status(200).json({
                token
            });
        } catch (error) {
            next(error);
        }
    }
}