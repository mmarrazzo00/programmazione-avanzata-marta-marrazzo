import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';

import { UpdateRequestController } from '../controllers/UpdateRequestController.js';
import { verifyJwt } from '../middleware/verifyJwt.js';
import { createUpdateRequestRules } from '../rules/updateRequestRules.js';
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

export default router;