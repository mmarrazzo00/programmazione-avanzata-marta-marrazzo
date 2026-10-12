import { Transaction } from 'sequelize';
import { UpdateRequest } from '../models/UpdateRequest.js';
import { Op, WhereOptions } from 'sequelize';

    export interface UpdateRequestFilters {
    fromDate?: Date;
    toDate?: Date;
    dateType?: 'createdAt' | 'updatedAt';
    status?: string;
}

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

    async findByVersionIds(
        versionIds: number[],
        filters: UpdateRequestFilters = {}
    ): Promise<UpdateRequest[]> {
        const where: WhereOptions = {
            gridModelId: { [Op.in]: versionIds }
        };

        if (filters.status) {
            Object.assign(where, { status: filters.status });
        }

        if (filters.fromDate || filters.toDate) {
            const dateFilter: Record<symbol, Date> = {};

            if (filters.fromDate) {
                dateFilter[Op.gte] = filters.fromDate;
            }

            if (filters.toDate) {
                dateFilter[Op.lte] = filters.toDate;
            }

            Object.assign(where, {
                [filters.dateType ?? 'createdAt']: dateFilter
            });
        }

        return UpdateRequest.findAll({
            where,
            order: [[filters.dateType ?? 'createdAt', 'DESC']]
        });
    }

    async findPendingByVersionIds(
        versionIds: number[],
        summaryOnly = false
    ): Promise<UpdateRequest[]> {
        return UpdateRequest.findAll({
            where: {
                gridModelId: { [Op.in]: versionIds },
                status: 'pending'
            },
            ...(summaryOnly
                ? {
                    attributes: [
                        'id',
                        'userId',
                        'gridModelId',
                        'status',
                        'createdAt'
                    ]
                }
                : {}),
            order: [['createdAt', 'DESC']]
        });
    }
}