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


const router = Router();

const updateRequestAnalysisController =
    new UpdateRequestAnalysisController();


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