import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';

import { UpdateRequestController } from '../controllers/UpdateRequestController.js';
import { verifyJwt } from '../middleware/verifyJwt.js';
import { createUpdateRequestRules, updateHistoryRules, updateRequestDecisionRules } from '../rules/updateRequestRules.js';
import { validate } from '../middleware/validate.js';


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
    updateHistoryRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        updateRequestController.getUpdates(req, res, next)
);

export default router;