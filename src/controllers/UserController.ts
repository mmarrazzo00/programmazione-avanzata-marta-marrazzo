import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService.js';

/**
 * Controller responsabile della gestione degli utenti.
 *
 * Gestisce le operazioni CRUD e l'aggiornamento dei crediti,
 * delegando la logica applicativa a UserService.
 *
 * Esclude la password dai dati restituiti nelle risposte HTTP
 * e inoltra gli eventuali errori al middleware globale.
 */
export class UserController {

    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    /**
     * Gestisce la registrazione di un nuovo utente.
     *
     * Delega la creazione al Service e restituisce
     * i dati dell'utente escludendo la password.
     */
    async createUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const user = await this.userService.createUser(req.body);

            // Esclude l'hash della password dalla risposta HTTP.
            const { password, ...userWithoutPassword } = user.toJSON();

            res.status(201).json(userWithoutPassword);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Recupera l'elenco di tutti gli utenti.
     *
     * Rimuove il campo password da ciascun utente
     * prima di restituire i risultati.
     */
    async getAllUsers(
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const users = await this.userService.getAllUsers();

            // Esclude la password dai dati di ogni utente.
            const usersWithoutPassword = users.map((user) => {
                const { password, ...userWithoutPassword } = user.toJSON();

                return userWithoutPassword;
            });

            res.status(200).json(usersWithoutPassword);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Recupera un utente tramite il suo identificativo.
     *
     * Restituisce i dati dell'utente senza il campo password.
     */
    async getUserById(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            // Converte l'identificativo ricevuto dalla rotta in numero.
            const id = Number(req.params.id);

            const user = await this.userService.getUserById(id);

            const { password, ...userWithoutPassword } = user.toJSON();

            res.status(200).json(userWithoutPassword);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Gestisce la modifica dei dati di un utente.
     *
     * Recupera l'identificativo e i nuovi dati dalla richiesta,
     * delegando l'aggiornamento al Service.
     */
    async updateUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const id = Number(req.params.id);

            const user = await this.userService.updateUser(
                id,
                req.body
            );

            // Restituisce l'utente aggiornato senza la password.
            const { password, ...userWithoutPassword } =
                user.toJSON();

            res.status(200).json(userWithoutPassword);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Gestisce l'eliminazione di un utente tramite ID.
     *
     * In caso di successo restituisce HTTP 204,
     * senza un contenuto nel body della risposta.
     */
    async deleteUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const id = Number(req.params.id);

            await this.userService.deleteUser(id);

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    /**
     * Gestisce la modifica del saldo dei crediti di un utente.
     *
     * Recupera l'email e la variazione di credito dal body
     * e delega l'operazione a UserService.
     */
    async updateCredit(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const { email, credit } = req.body;

            const user = await this.userService.updateCredit(
                email,
                credit
            );

            // Restituisce il saldo aggiornato e i dati essenziali
            // dell'utente, senza includere la password.
            res.json({
                message: 'Credit updated successfully',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    credit: user.credit
                }
            });
        } catch (error) {
            next(error);
        }
    }

}