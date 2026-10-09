
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

const router = Router();
const modelExecutionController = new ModelExecutionController();

router.post(
    '/models/:modelId/execute',
    verifyJwt,
    modelExecutionRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        modelExecutionController.execute(req, res, next)
);

export default router;