import bcrypt from 'bcrypt';
import { UserDAO } from '../dao/UserDAO.js';
import { HttpError } from '../middleware/errorHandler.js';
import { generateToken } from '../utils/jwt.js';

export class AuthService {

    private userDAO: UserDAO;

    constructor() {
        this.userDAO = new UserDAO();
    }

    async login(
        email: string,
        password: string
    ): Promise<string> {

        const user = await this.userDAO.findByEmail(email);

        if (!user) {
            throw new HttpError(401, 'Invalid credentials');
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            throw new HttpError(401, 'Invalid credentials');
        }

        const token = generateToken({
            userId: user.id,
            username: user.username,
            role: user.role
        });

        return token;
    }
}