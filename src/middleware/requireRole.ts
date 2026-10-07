import { Request, Response, NextFunction } from 'express';
import { HttpError } from './errorHandler.js';

export function requireRole(role: string) {
    return (
        req: Request,
        _res: Response,
        next: NextFunction
    ): void => {

        if (!req.user) {
            next(new HttpError(401, 'User not authenticated'));
            return;
        }

        if (req.user.role !== role) {
            next(new HttpError(403, 'Forbidden'));
            return;
        }

        next();
    };
}