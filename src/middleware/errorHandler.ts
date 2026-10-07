import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export class HttpError extends Error {
    status: number;
    details?: unknown;

    constructor(
        status: number,
        message: string,
        details?: unknown
    ) {
        super(message);
        this.status = status;
        this.details = details;

        Object.setPrototypeOf(this, HttpError.prototype);
    }
}

export function notFound(
    _req: Request,
    res: Response
): void {
    res.status(404).json({
        error: 'Resource not found'
    });
}

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {

    if (err instanceof HttpError) {
        res.status(err.status).json({
            error: err.message,
            ...(err.details !== undefined && {
                details: err.details
            })
        });
        return;
    }

    if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({
            error: 'Token expired'
        });
        return;
    }

    if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
            error: 'Invalid token'
        });
        return;
    }

    console.error('Unhandled error:', err);

    res.status(500).json({
        error: 'Internal server error'
    });
}