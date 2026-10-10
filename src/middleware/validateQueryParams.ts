import { Request, Response, NextFunction } from 'express';
import { HttpError } from './errorHandler.js';

export const validateQueryParams = (
    allowedParams: string[]
) => {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ): void => {
        const receivedParams = Object.keys(req.query);

        const unexpectedParams = receivedParams.filter(
            param => !allowedParams.includes(param)
        );

        if (unexpectedParams.length > 0) {
            return next(
                new HttpError(
                    400,
                    `Unexpected query parameters: ${unexpectedParams.join(', ')}`
                )
            );
        }

        next();
    };
};
