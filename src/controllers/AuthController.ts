import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService.js';

export class AuthController {

    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    async login(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const { email, password } = req.body;

            const token = await this.authService.login(
                email,
                password
            );

            res.status(200).json({
                token
            });
        } catch (error) {
            next(error);
        }
    }
}