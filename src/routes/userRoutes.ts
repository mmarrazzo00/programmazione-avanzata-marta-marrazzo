import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';

import { UserController } from '../controllers/UserController.js';

import {
    createUserRules,
    updateUserRules,
    updateCreditRules
} from '../rules/userRules.js';

import { validate } from '../middleware/validate.js';
import { verifyJwt } from '../middleware/verifyJwt.js';
import { requireRole } from '../middleware/requireRole.js';

// Crea il router Express dedicato alla gestione degli utenti.
const router = Router();

// Istanzia il controller responsabile delle operazioni sugli utenti.
const userController = new UserController();

/**
 * POST /users
 *
 * Registra un nuovo utente senza richiedere autenticazione.
 * Applica le regole di validazione prima di eseguire la creazione.
 */
router.post(
    '/users',
    createUserRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        userController.createUser(req, res, next)
);

/**
 * GET /users
 *
 * Restituisce l'elenco degli utenti registrati.
 * L'accesso è riservato agli amministratori autenticati.
 */
router.get(
    '/users',
    verifyJwt,
    requireRole('admin'),
    (req: Request, res: Response, next: NextFunction) =>
        userController.getAllUsers(req, res, next)
);

/**
 * PATCH /users/credit
 *
 * Permette all'amministratore di modificare il saldo
 * dei crediti di un utente.
 *
 * Richiede autenticazione, ruolo admin e validazione dei dati.
 */
router.patch(
    '/users/credit',
    verifyJwt,
    requireRole('admin'),
    updateCreditRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        userController.updateCredit(req, res, next)
);

/**
 * GET /users/:id
 *
 * Recupera i dati di un utente tramite identificativo.
 * L'accesso è riservato agli amministratori autenticati.
 */
router.get(
    '/users/:id',
    verifyJwt,
    requireRole('admin'),
    (req: Request, res: Response, next: NextFunction) =>
        userController.getUserById(req, res, next)
);

/**
 * PATCH /users/:id
 *
 * Permette all'amministratore di modificare i dati di un utente.
 * Applica le regole di validazione prima dell'aggiornamento.
 */
router.patch(
    '/users/:id',
    verifyJwt,
    requireRole('admin'),
    updateUserRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        userController.updateUser(req, res, next)
);

/**
 * DELETE /users/:id
 *
 * Elimina un utente tramite identificativo.
 * L'operazione è riservata agli amministratori autenticati.
 */
router.delete(
    '/users/:id',
    verifyJwt,
    requireRole('admin'),
    (req: Request, res: Response, next: NextFunction) =>
        userController.deleteUser(req, res, next)
);

export default router;
