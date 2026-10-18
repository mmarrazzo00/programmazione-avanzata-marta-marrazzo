
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

const router = Router();

const userController = new UserController();

// REGISTRAZIONE PUBBLICA
// Non richiede autenticazione.
router.post(
    '/users',
    createUserRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        userController.createUser(req, res, next)
);

// ELENCO UTENTI
// Solo amministratore.
router.get(
    '/users',
    verifyJwt,
    requireRole('admin'),
    (req: Request, res: Response, next: NextFunction) =>
        userController.getAllUsers(req, res, next)
);

// RICARICA CREDITI
// Solo amministratore.
router.patch(
    '/users/credit',
    verifyJwt,
    requireRole('admin'),
    updateCreditRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        userController.updateCredit(req, res, next)
);

// CONSULTAZIONE UTENTE
// Solo amministratore.
router.get(
    '/users/:id',
    verifyJwt,
    requireRole('admin'),
    (req: Request, res: Response, next: NextFunction) =>
        userController.getUserById(req, res, next)
);

// MODIFICA UTENTE
// Solo amministratore.
router.patch(
    '/users/:id',
    verifyJwt,
    requireRole('admin'),
    updateUserRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        userController.updateUser(req, res, next)
);

// ELIMINAZIONE UTENTE
// Solo amministratore.
router.delete(
    '/users/:id',
    verifyJwt,
    requireRole('admin'),
    (req: Request, res: Response, next: NextFunction) =>
        userController.deleteUser(req, res, next)
);

export default router;
