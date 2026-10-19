
import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';

import { verifyJwt } from '../middleware/verifyJwt.js';
import { updateHistoryRules, modelPendingStatusRules } from '../rules/updateRequestRules.js';
import { validate } from '../middleware/validate.js';
import { validateQueryParams } from '../middleware/validateQueryParams.js';
import { UpdateRequestAnalysisController } from '../controllers/UpdateRequestAnalysisController.js';

// Crea il router Express dedicato all'analisi delle richieste.
const router = Router();

// Istanzia il controller che gestisce le operazioni di analisi.
const updateRequestAnalysisController =
    new UpdateRequestAnalysisController();

/**
 * GET /analysis/:modelId/updates
 *
 * Recupera lo storico delle richieste di aggiornamento
 * associate a un modello, con eventuali filtri.
 *
 * Verifica l'autenticazione, limita i parametri di query
 * consentiti e ne valida i valori prima di chiamare il controller.
 */
router.get(
    '/analysis/:modelId/updates',
    verifyJwt,
    validateQueryParams([
        'FROM',
        'TO',
        'STATUS',
        'DATE_TYPE'
    ]),
    updateHistoryRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        updateRequestAnalysisController.getUpdates(req, res, next)
);

/**
 * GET /analysis/pending-requests
 *
 * Recupera le richieste di aggiornamento in attesa
 * associate all'utente autenticato, secondo i criteri del Service.
 *
 * L'identità dell'utente viene verificata tramite JWT.
 */
router.get(
    '/analysis/pending-requests',
    verifyJwt,
    (req: Request, res: Response, next: NextFunction) =>
        updateRequestAnalysisController.getMyPendingRequests(
            req,
            res,
            next
        )
);

/**
 * GET /analysis/:modelId/status
 *
 * Recupera informazioni sulle richieste di aggiornamento
 * ancora pending per uno specifico modello.
 *
 * Richiede autenticazione e valida l'identificativo del modello.
 */
router.get(
    '/analysis/:modelId/status',
    verifyJwt,
    modelPendingStatusRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        updateRequestAnalysisController.getModelPendingStatus(
            req,
            res,
            next
        )
);

export default router;
