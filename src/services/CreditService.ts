import { User } from '../models/User.js';
import { HttpError } from '../middleware/errorHandler.js';
import { Transaction } from 'sequelize';

export class CreditService {

async checkAndConsume(
    userId: number,
    amount: number,
    transaction?: Transaction
): Promise<void> {

    const user = await User.findByPk(userId, {
        transaction
    });

    if (!user) {
        throw new HttpError(401, 'User not found');
    }

    console.log('Current credit:', user.credit, 'Amount to consume:', amount);

    const currentCredit = Number(user.credit);

    if (currentCredit < amount) {
        throw new HttpError(401, 'Insufficient credit');
    }

    user.credit = currentCredit - amount;

    console.log('New credit after consumption:', user.credit);

    await user.save({
        transaction
    });
}
}