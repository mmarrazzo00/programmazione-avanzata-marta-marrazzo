import bcrypt from 'bcrypt';
import { UserDAO } from '../dao/UserDAO.js';
import { HttpError } from '../middleware/errorHandler.js';
import { User } from '../models/User.js';

export class UserService {

    private userDAO: UserDAO;

    constructor() {
        this.userDAO = new UserDAO();
    }

    async createUser(data: {
        username: string;
        email: string;
        password: string;
        role?: string;
    }) {
        const existingUser = await this.userDAO.findByEmail(data.email);

        if (existingUser) {
            throw new HttpError(409, 'Email already in use');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        return this.userDAO.create({
            ...data,
            password: hashedPassword
        });
    }

    async getAllUsers() {
    return this.userDAO.findAll();
}
    
    async getUserById(id: number) {
        const user = await this.userDAO.findById(id);
        if (!user) {
            throw new HttpError(404, 'User not found');
        }
        return user;
    }


    async updateUser(
    id: number,
    data: {
        username?: string;
        email?: string;
        password?: string;
        role?: string;
    }
) {
    const user = await this.userDAO.findById(id);

    if (!user) {
        throw new HttpError(404, 'User not found');
    }

    if (data.email && data.email !== user.email) {
        const existingUser = await this.userDAO.findByEmail(data.email);

        if (existingUser) {
            throw new HttpError(409, 'Email already in use');
        }
    }

    if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
    }

    const [affectedRows, updatedUsers] =
        await this.userDAO.update(id, data);

    if (affectedRows === 0) {
        throw new HttpError(404, 'User not found');
    }

    return updatedUsers[0];
}

async deleteUser(id: number): Promise<void> {
    const deletedRows = await this.userDAO.delete(id);

    if (deletedRows === 0) {
        throw new HttpError(404, 'User not found');
    }
}

async updateCredit(
    email: string,
    credit: number
): Promise<User> {

    const user = await this.userDAO.updateCredit(email, credit);

    if (!user) {
        throw new HttpError(404, 'User not found');
    }

    return user;
}

}