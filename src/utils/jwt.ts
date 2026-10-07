import dotenv from 'dotenv';
import fs from 'fs';
import jwt from 'jsonwebtoken';

dotenv.config();

const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;

if (!privateKeyPath) {
    throw new Error('JWT_PRIVATE_KEY_PATH is not defined');
}

const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

export interface UserPayload {
    userId: number;
    username: string;
    role: string;
}

export function generateToken(payload: UserPayload): string {
    return jwt.sign(payload, privateKey, {
        algorithm: 'RS256',
        expiresIn: '1h'
    });
}