import { Transaction } from 'sequelize';
import { Update } from '../models/Update.js';

export class UpdateDAO {

    async create(
        data: {
            updateRequestId: number;
            row: number;
            column: number;
            oldValue: number;
            newValue: number;
        },
        transaction?: Transaction
    ): Promise<Update> {
        return Update.create(data, { transaction });
    }

    async createMany(
        updates: {
            updateRequestId: number;
            row: number;
            column: number;
            oldValue: number;
            newValue: number;
        }[],
        transaction?: Transaction
    ): Promise<Update[]> {
        return Update.bulkCreate(updates, { transaction });
    }

    async findByRequestId(
        requestId: number,
        transaction?: Transaction,
        lock = false,
        attributes?: string[]
    ): Promise<Update[]> {
        return Update.findAll({
            where: { updateRequestId: requestId },
            ...(attributes ? { attributes } : {}),
            transaction,
            ...(lock && transaction
                ? { lock: transaction.LOCK.UPDATE }
                : {})
        });
    }

}