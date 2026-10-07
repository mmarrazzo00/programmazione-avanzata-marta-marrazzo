import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService.js';

export class UserController {

    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    async createUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const user = await this.userService.createUser(req.body);

            const { password, ...userWithoutPassword } = user.toJSON();

            res.status(201).json(userWithoutPassword);
        } catch (error) {
            next(error);
        }
    }

    async getAllUsers(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const users = await this.userService.getAllUsers();

        const usersWithoutPassword = users.map((user) => {
            const { password, ...userWithoutPassword } = user.toJSON();

            return userWithoutPassword;
        });

        res.status(200).json(usersWithoutPassword);
    } catch (error) {
        next(error);
    }
}

async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = Number(req.params.id);

        const user = await this.userService.getUserById(id);

        const { password, ...userWithoutPassword } = user.toJSON();

        res.status(200).json(userWithoutPassword);
    } catch (error) {
        next(error);
    }
}

async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = Number(req.params.id);

        const user = await this.userService.updateUser(
            id,
            req.body
        );

        const { password, ...userWithoutPassword } =
            user.toJSON();

        res.status(200).json(userWithoutPassword);
    } catch (error) {
        next(error);
    }
}

async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = Number(req.params.id);

        await this.userService.deleteUser(id);

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

async updateCredit(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email, credit } = req.body;

        const user = await this.userService.updateCredit(
            email,
            credit
        );

        res.json({
            message: 'Credit updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                credit: user.credit
            }
        });
    } catch (error) {
        next(error);
    }
}

}