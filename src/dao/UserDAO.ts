import { User } from '../models/User.js';

export class UserDAO {

    async create(data: {
        username: string;
        email: string;
        password: string;
        role?: string;
    }): Promise<User> {
        return User.create(data);
    }

    async findById(id: number): Promise<User | null> {
        return User.findByPk(id);
    }

    async findByEmail(email: string): Promise<User | null> {
        return User.findOne({
            where: { email }
        });
    }

    async findAll(): Promise<User[]> {
        return User.findAll();
    }

    async update(
        id: number,
        data: Partial<{
            username: string;
            email: string;
            password: string;
            role: string;
        }>
    ): Promise<[number, User[]]> {
        return User.update(data, {
            where: { id },
            returning: true
        });
    }

    async delete(id: number): Promise<number> {
        return User.destroy({
            where: { id }
        });
    }

    async updateCredit(
    email: string,
    credit: number
): Promise<User | null> {
    const user = await User.findOne({
        where: { email }
    });

    if (!user) {
        return null;
    }

    const currentCredit = Number(user.credit);
    user.credit = currentCredit + credit;

    await user.save();

    return user;
}
}