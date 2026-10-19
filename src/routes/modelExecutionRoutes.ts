import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';

import { ModelExecutionController } from '../controllers/ModelExecutionController.js';
import { verifyJwt } from '../middleware/verifyJwt.js';
import { modelExecutionRules } from '../rules/modelExecutionRules.js';
import { validate } from '../middleware/validate.js';

// Crea il router Express dedicato all'esecuzione dei modelli.
const router = Router();

// Istanzia il controller responsabile delle richieste di esecuzione.
const modelExecutionController = new ModelExecutionController();

/**
 * POST /models/:modelId/execute
 *
 * Permette a un utente autenticato di eseguire
 * l'algoritmo di pathfinding su un modello a griglia.
 *
 * Verifica il token JWT e valida i parametri della richiesta
 * prima di delegare l'esecuzione al controller.
 */
router.post(
    '/models/:modelId/execute',
    verifyJwt,
    modelExecutionRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        modelExecutionController.execute(req, res, next)
);

export default router;
