import { GridModel } from '../models/GridModel.js';
import { CreditService } from './CreditService.js';
import { HttpError } from '../middleware/errorHandler.js';
import { Update } from '../models/Update.js';
import { UpdateRequest } from '../models/UpdateRequest.js';
import { sequelize } from '../shared/db.js';
import { Transaction } from 'sequelize';

export interface CellUpdate {
    row: number;
    column: number;
    newValue: number;
}

interface PreparedCellUpdate {
    row: number;
    column: number;
    oldValue: number;
    newValue: number;
}

export class UpdateRequestService {

    private creditService = new CreditService();

    async createUpdateRequest(
        userId: number,
        modelId: string,
        updates: CellUpdate[]
    ) {
        const model = await this.findValidModel(modelId);

        const cellUpdates =
            this.validateAndPrepareUpdates(model, updates);

        const cost = this.calculateUpdateCost(
            cellUpdates.length
        );

        const transaction = await sequelize.transaction();

        try {

            const isOwner = model.ownerId === userId;

            const request =
                await this.createUpdateRequestRecord(
                    userId,
                    model,
                    cellUpdates,
                    cost,
                    isOwner,
                    transaction
                );

            if (isOwner) {

              await this.consumeCredit(
                userId,
                cost,
                transaction);

             await this.applyDirectUpdate(
                model,
                cellUpdates,
                transaction);

            }

            await transaction.commit();

            return request;

        } catch (error) {

            await transaction.rollback();

            throw error;
        }
    }

    private async findValidModel(
        modelId: string
    ): Promise<GridModel> {

        const model = await GridModel.findOne({
            where: {
                modelId,
                valid: true
            }
        });

        if (!model) {
            throw new HttpError(
                404,
                'Model not found'
            );
        }

        return model;
    }

    private validateAndPrepareUpdates(
        model: GridModel,
        updates: CellUpdate[]
    ): PreparedCellUpdate[] {

        const cellUpdates: PreparedCellUpdate[] = [];

        for (const update of updates) {

            if (
                update.row >= model.rows ||
                update.column >= model.columns
            ) {
                throw new HttpError(
                    400,
                    'Cell position is outside the matrix'
                );
            }

            const oldValue =
                model.matrix[update.row][update.column];

            if (oldValue === update.newValue) {
                throw new HttpError(
                    400,
                    'New value must be different from current value'
                );
            }

            cellUpdates.push({
                row: update.row,
                column: update.column,
                oldValue,
                newValue: update.newValue
            });
        }

        return cellUpdates;
    }

    private calculateUpdateCost(
        numberOfCells: number
    ): number {

        return Number(
            (0.35 * numberOfCells).toFixed(2)
        );
    }

    private async consumeCredit(
        userId: number,
        cost: number,
        transaction: Transaction
    ): Promise<void> {

        await this.creditService.checkAndConsume(
            userId,
            cost,
            transaction
        );
    }

    private async createUpdateRequestRecord(
        userId: number,
        model: GridModel,
        cellUpdates: PreparedCellUpdate[],
        cost: number,
        isOwner: boolean,
        transaction: Transaction
    ): Promise<UpdateRequest> {

        const request = await UpdateRequest.create({
            userId,
            gridModelId: model.id,
            cost,
            status: isOwner ? 'auto' : 'pending',
            decidedAt: isOwner ? new Date() : null
        }, {
            transaction
        });

        for (const cell of cellUpdates) {

            await Update.create({
                updateRequestId: request.id,
                row: cell.row,
                column: cell.column,
                oldValue: cell.oldValue,
                newValue: cell.newValue
            }, {
                transaction
            });
        }

        return request;
    }

    private async applyDirectUpdate(
        model: GridModel,
        cellUpdates: PreparedCellUpdate[],
        transaction: Transaction
    ): Promise<GridModel> {

        const newMatrix =
            model.matrix.map(row => [...row]);

        for (const update of cellUpdates) {

            newMatrix[update.row][update.column] =
                update.newValue;
        }

        model.valid = false;

        await model.save({
            transaction
        });

        const newModel = await GridModel.create({
            modelId: model.modelId,
            name: model.name,
            ownerId: model.ownerId,
            rows: model.rows,
            columns: model.columns,
            matrix: newMatrix,
            version: model.version + 1,
            valid: true
        }, {
            transaction
        });

        return newModel;
    }
}