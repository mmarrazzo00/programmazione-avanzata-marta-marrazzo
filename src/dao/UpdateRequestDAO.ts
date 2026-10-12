import { Transaction } from 'sequelize';
import { UpdateRequest } from '../models/UpdateRequest.js';

export class UpdateRequestDAO {

    async create(
        data: {
            userId: number;
            gridModelId: number;
            parentRequestId?: number | null;
            cost: number;
            status: string;
            decidedAt?: Date | null;
        },
        transaction?: Transaction
    ): Promise<UpdateRequest> {
        return UpdateRequest.create(data, { transaction });
    }

    async findById(
        id: number,
        transaction?: Transaction,
        lock = false
    ): Promise<UpdateRequest | null> {
        return UpdateRequest.findByPk(id, {
            transaction,
            ...(lock && transaction
                ? { lock: transaction.LOCK.UPDATE }
                : {})
        });
    }

    async findPendingById(
        id: number,
        transaction: Transaction
    ): Promise<UpdateRequest | null> {
        return UpdateRequest.findOne({
            where: {
                id,
                status: 'pending'
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });
    }

    async save(
        request: UpdateRequest,
        transaction?: Transaction
    ): Promise<void> {
        await request.save({ transaction });
    }
}
