import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { HttpError } from './errorHandler.js';

export function validate(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        next(
            new HttpError(
                400,
                'Validation error',
                errors.array()
            )
        );
        return;
    }

    next();
}