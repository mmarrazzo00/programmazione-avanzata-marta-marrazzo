import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';

import { UpdateRequestController } from '../controllers/UpdateRequestController.js';
import { verifyJwt } from '../middleware/verifyJwt.js';
import { createUpdateRequestRules, updateHistoryRules, updateRequestDecisionRules, modelPendingStatusRules } from '../rules/updateRequestRules.js';
import { validate } from '../middleware/validate.js';
import { validateQueryParams } from '../middleware/validateQueryParams.js';


const router = Router();

const updateRequestController =
    new UpdateRequestController();

router.post(
    '/models/:modelId',
    verifyJwt,
    createUpdateRequestRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        updateRequestController.create(req, res, next)
);

router.patch(
    '/update-requests/:requestId/decision',
    verifyJwt,
    updateRequestDecisionRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        updateRequestController.decide(req, res, next)
);


router.get(
    '/models/:modelId/updates',
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
        updateRequestController.getUpdates(req, res, next)
);

router.get(
    '/models/:modelId/status',
    verifyJwt,
    modelPendingStatusRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        updateRequestController.getModelPendingStatus(
            req,
            res,
            next
        )
);



router.get(
    '/models/pending-requests',
    verifyJwt,
    (req: Request, res: Response, next: NextFunction) =>
        updateRequestController.getMyPendingRequests(
            req,
            res,
            next
        )
);

export default router;