import { User } from '../models/User.js';
import { HttpError } from '../middleware/errorHandler.js';

export class CreditService {

    async checkAndConsume(
        userId: number,
        amount: number
    ): Promise<void> {

        const user = await User.findByPk(userId);

        if (!user) {
            throw new HttpError(401, 'User not found');
        }

        const currentCredit = Number(user.credit);

        if (currentCredit < amount) {
            throw new HttpError(401, 'Insufficient credit');
        }

        user.credit = currentCredit - amount;

        await user.save();
    }
}