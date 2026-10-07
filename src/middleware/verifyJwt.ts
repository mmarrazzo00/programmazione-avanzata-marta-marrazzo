import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { HttpError } from './errorHandler.js';

dotenv.config();

const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH;

if (!publicKeyPath) {
    throw new Error('JWT_PUBLIC_KEY_PATH is not defined');
}

const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

export function verifyJwt(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new HttpError(401, 'Authorization header missing');
        }

        const [type, token] = authHeader.split(' ');

        if (type !== 'Bearer' || !token) {
            throw new HttpError(401, 'Invalid authorization format');
        }

        const decoded = jwt.verify(token, publicKey, {
            algorithms: ['RS256']
        });

        req.user = decoded as {
            userId: number;
            username: string;
            role: string;
        };

        next();
    } catch (error) {
        next(error);
    }
}