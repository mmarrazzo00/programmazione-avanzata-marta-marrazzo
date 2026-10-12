import { Transaction } from 'sequelize';
import { GridModel } from '../models/GridModel.js';

export class GridModelDAO {

    async create(
        data: {
            modelId: string;
            name: string;
            ownerId: number;
            rows: number;
            columns: number;
            matrix: number[][];
            version: number;
            valid: boolean;
        },
        transaction?: Transaction
    ): Promise<GridModel> {
        return GridModel.create(data, { transaction });
    }

    async findValidByModelId(
        modelId: string,
        transaction?: Transaction
    ): Promise<GridModel | null> {
        return GridModel.findOne({
            where: {
                modelId,
                valid: true
            },
            transaction
        });
    }

    async findById(
        id: number,
        transaction?: Transaction,
        lock = false
    ): Promise<GridModel | null> {
        return GridModel.findByPk(id, {
            transaction,
            ...(lock && transaction
                ? { lock: transaction.LOCK.UPDATE }
                : {})
        });
    }

    async save(
        model: GridModel,
        transaction?: Transaction
    ): Promise<void> {
        await model.save({ transaction });
    }

    async findVersionsByModelId(modelId: string): Promise<GridModel[]> {
        return GridModel.findAll({
            where: { modelId },
            attributes: ['id']
        });
    }

    async findOwnedByUserId(userId: number): Promise<GridModel[]> {
        return GridModel.findAll({
            where: { ownerId: userId },
            attributes: ['id', 'modelId', 'name', 'version']
        });
    }
}