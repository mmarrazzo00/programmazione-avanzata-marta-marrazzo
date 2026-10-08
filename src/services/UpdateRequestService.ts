
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
    ): Promise<UpdateRequest> {
        const model = await this.findValidModel(modelId);
        const cellUpdates = this.validateAndPrepareUpdates(model, updates);
        const cost = this.calculateUpdateCost(cellUpdates.length);
        const transaction = await sequelize.transaction();

        try {
            const isOwner = model.ownerId === userId;

            const request = await this.createUpdateRequestRecord(
                userId,
                model,
                cellUpdates,
                cost,
                isOwner,
                transaction
            );

            if (isOwner) {
                await this.consumeCredit(userId, cost, transaction);
                await this.applyDirectUpdate(
                    model,
                    cellUpdates,
                    transaction
                );
            }

            await transaction.commit();
            return request;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async decideUpdateRequest(
        requestId: number,
        ownerId: number,
        accept: boolean
    ): Promise<UpdateRequest> {
        const transaction = await sequelize.transaction();

        try {
            const request = await this.findPendingRequest(
                requestId,
                transaction
            );

            const model = await this.findRequestModel(
                request.gridModelId,
                transaction
            );

            this.checkModelOwner(model, ownerId);

            if (!accept) {
                request.status = 'rejected';
                request.decidedAt = new Date();

                await request.save({ transaction });
                await transaction.commit();

                return request;
            }

            if (!model.valid) {
                throw new HttpError(
                    409,
                    'Cannot approve a request for an outdated model version'
                );
            }

            const updates = await this.findRequestUpdates(
                request.id,
                transaction
            );

            const cellUpdates = this.prepareStoredUpdates(updates);

            // Verifica che le celle non siano cambiate rispetto
            // alla versione sulla quale era stata creata la richiesta.
            for (const update of cellUpdates) {
                const currentValue =
                    model.matrix[update.row]?.[update.column];

                if (currentValue !== update.oldValue) {
                    throw new HttpError(
                        409,
                        'The requested cells have changed since the request was created'
                    );
                }
            }

            await this.consumeCredit(
                request.userId,
                Number(request.cost),
                transaction
            );

            await this.applyDirectUpdate(
                model,
                cellUpdates,
                transaction
            );

            request.status = 'accepted';
            request.decidedAt = new Date();

            await request.save({ transaction });

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
            where: { modelId, valid: true }
        });

        if (!model) {
            throw new HttpError(404, 'Model not found');
        }

        return model;
    }

    private validateAndPrepareUpdates(
        model: GridModel,
        updates: CellUpdate[]
    ): PreparedCellUpdate[] {
        if (!Array.isArray(updates) || updates.length === 0) {
            throw new HttpError(
                400,
                'At least one cell update is required'
            );
        }

        const cellUpdates: PreparedCellUpdate[] = [];
        const seenCells = new Set<string>();

        for (const update of updates) {
            if (
                !Number.isInteger(update.row) ||
                !Number.isInteger(update.column) ||
                !Number.isInteger(update.newValue) ||
                update.row < 0 ||
                update.column < 0 ||
                (update.newValue !== 0 && update.newValue !== 1)
            ) {
                throw new HttpError(400, 'Invalid cell update');
            }

            if (
                update.row >= model.rows ||
                update.column >= model.columns
            ) {
                throw new HttpError(
                    400,
                    'Cell position is outside the matrix'
                );
            }

            const cellKey = `${update.row},${update.column}`;

            if (seenCells.has(cellKey)) {
                throw new HttpError(
                    400,
                    'A cell cannot be updated more than once in the same request'
                );
            }

            seenCells.add(cellKey);

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

    private calculateUpdateCost(numberOfCells: number): number {
        return Number((0.35 * numberOfCells).toFixed(2));
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
        }, { transaction });

        for (const cell of cellUpdates) {
            await Update.create({
                updateRequestId: request.id,
                row: cell.row,
                column: cell.column,
                oldValue: cell.oldValue,
                newValue: cell.newValue
            }, { transaction });
        }

        return request;
    }

    private async applyDirectUpdate(
        model: GridModel,
        cellUpdates: PreparedCellUpdate[],
        transaction: Transaction
    ): Promise<GridModel> {
        const newMatrix = model.matrix.map(row => [...row]);

        for (const update of cellUpdates) {
            newMatrix[update.row][update.column] = update.newValue;
        }

        model.valid = false;
        await model.save({ transaction });

        return GridModel.create({
            modelId: model.modelId,
            name: model.name,
            ownerId: model.ownerId,
            rows: model.rows,
            columns: model.columns,
            matrix: newMatrix,
            version: model.version + 1,
            valid: true
        }, { transaction });
    }

    private async findPendingRequest(
        requestId: number,
        transaction: Transaction
    ): Promise<UpdateRequest> {
        const request = await UpdateRequest.findOne({
            where: {
                id: requestId,
                status: 'pending'
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!request) {
            throw new HttpError(
                404,
                'Pending update request not found'
            );
        }

        return request;
    }

    private async findRequestModel(
        gridModelId: number,
        transaction: Transaction
    ): Promise<GridModel> {
        const model = await GridModel.findByPk(gridModelId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!model) {
            throw new HttpError(
                404,
                'Model associated with the request not found'
            );
        }

        return model;
    }

    private checkModelOwner(
        model: GridModel,
        ownerId: number
    ): void {
        if (model.ownerId !== ownerId) {
            throw new HttpError(
                403,
                'Only the model owner can decide this request'
            );
        }
    }

    private async findRequestUpdates(
        requestId: number,
        transaction: Transaction
    ): Promise<Update[]> {
        const updates = await Update.findAll({
            where: { updateRequestId: requestId },
            transaction
        });

        if (updates.length === 0) {
            throw new HttpError(
                400,
                'No cell updates found for this request'
            );
        }

        return updates;
    }

    private prepareStoredUpdates(
        updates: Update[]
    ): PreparedCellUpdate[] {
        return updates.map(update => ({
            row: update.row,
            column: update.column,
            oldValue: update.oldValue,
            newValue: update.newValue
        }));
    }
}