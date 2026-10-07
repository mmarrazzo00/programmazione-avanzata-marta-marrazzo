import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';

import { AuthController } from '../controllers/AuthController.js';
import { authRules } from '../rules/authRules.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const authController = new AuthController();

router.post(
    '/login',
    authRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        authController.login(req, res, next)
);

export default router;