import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';

import { GridModelController } from '../controllers/GridModelController.js';
import { verifyJwt } from '../middleware/verifyJwt.js';
import { createModelRules } from '../rules/gridModelRules.js';
import { validate } from '../middleware/validate.js';

// Crea il router Express dedicato alla gestione dei modelli a griglia.
const router = Router();

// Istanzia il controller responsabile della creazione dei modelli.
const gridModelController = new GridModelController();

/**
 * POST /models
 *
 * Permette a un utente autenticato di creare un nuovo modello a griglia.
 *
 * Verifica il token JWT e applica le regole di validazione
 * prima di delegare la creazione al controller.
 */
router.post(
    '/models',
    verifyJwt,
    createModelRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        gridModelController.create(req, res, next)
);

export default router;