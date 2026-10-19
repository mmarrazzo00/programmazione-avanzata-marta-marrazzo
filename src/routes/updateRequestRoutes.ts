import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';

import { UpdateRequestController } from '../controllers/UpdateRequestController.js';
import { verifyJwt } from '../middleware/verifyJwt.js';
import { createUpdateRequestRules, updateRequestDecisionRules } from '../rules/updateRequestRules.js';
import { validate } from '../middleware/validate.js';

// Crea il router Express dedicato alle richieste di aggiornamento.
const router = Router();

// Istanzia il controller responsabile della gestione delle richieste.
const updateRequestController =
    new UpdateRequestController();

/**
 * POST /models/:modelId
 *
 * Permette a un utente autenticato di proporre modifiche
 * a un modello a griglia.
 *
 * Verifica il JWT e valida i dati della richiesta
 * prima di delegare la creazione al controller.
 */
router.post(
    '/models/:modelId',
    verifyJwt,
    createUpdateRequestRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        updateRequestController.create(req, res, next)
);

/**
 * PATCH /update-requests/:requestId/decision
 *
 * Gestisce l'accettazione o il rifiuto complessivo
 * di una richiesta di aggiornamento.
 *
 * Richiede autenticazione e validazione della decisione.
 */
router.patch(
    '/update-requests/:requestId/decision',
    verifyJwt,
    updateRequestDecisionRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        updateRequestController.decide(req, res, next)
);

/**
 * PATCH /update-requests/:requestId/cell-decisions
 *
 * Gestisce le decisioni sulle singole celle di una richiesta.
 *
 * Consente di distinguere tra accettazione completa,
 * rifiuto completo e decisioni miste che richiedono
 * la suddivisione della richiesta.
 */
router.patch(
    '/update-requests/:requestId/cell-decisions',
    verifyJwt,
    (req: Request, res: Response, next: NextFunction) =>
        updateRequestController.decideCells(req, res, next)
);

export default router;
