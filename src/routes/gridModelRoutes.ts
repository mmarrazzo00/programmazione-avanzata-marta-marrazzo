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

const router = Router();

const gridModelController = new GridModelController();

router.post(
    '/models',
    verifyJwt,
    createModelRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        gridModelController.create(req, res, next)
);

export default router;