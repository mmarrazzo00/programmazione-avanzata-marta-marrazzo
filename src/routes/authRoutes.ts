import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';

import { AuthController } from '../controllers/AuthController.js';
import { authRules } from '../rules/authRules.js';
import { validate } from '../middleware/validate.js';

// Crea il router Express dedicato all'autenticazione.
const router = Router();

// Istanzia il controller che gestisce le richieste di login.
const authController = new AuthController();

/**
 * POST /login
 *
 * Gestisce l'autenticazione degli utenti.
 *
 * La richiesta attraversa le regole di validazione e il middleware
 * validate prima di essere inoltrata al controller.
 */
router.post(
    '/login',
    authRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        authController.login(req, res, next)
);

export default router;
