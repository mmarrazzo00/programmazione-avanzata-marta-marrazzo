import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express';

import { UserController } from '../controllers/UserController.js';
import { createUserRules, updateCreditRules } from '../rules/userRules.js';
import { updateUserRules } from '../rules/userRules.js';
import { validate } from '../middleware/validate.js';
import { verifyJwt } from '../middleware/verifyJwt.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

const userController = new UserController();

router.post(
    '/users',
    createUserRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        userController.createUser(req, res, next)
);

router.get(
    '/users',
    verifyJwt,
    requireRole('admin'),
    (req: Request, res: Response, next: NextFunction) =>
        userController.getAllUsers(req, res, next)
);

router.patch(
    '/users/credit',
    verifyJwt,
    requireRole('admin'),
    updateCreditRules,
    validate,
    userController.updateCredit.bind(userController)
);

router.get(
    '/users/:id',
    (req: Request, res: Response, next: NextFunction) =>
        userController.getUserById(req, res, next)
);

router.patch(
    '/users/:id',
    updateUserRules,
    validate,
    (req: Request, res: Response, next: NextFunction) =>
        userController.updateUser(req, res, next)
);

router.delete(
    '/users/:id',
    (req: Request, res: Response, next: NextFunction) =>
        userController.deleteUser(req, res, next)
);

export default router;