
import { performance } from 'node:perf_hooks';
import { AStarFinder } from 'astar-typescript';
import { GridModel } from '../models/GridModel.js';
import { Execution } from '../models/Execution.js';
import { CreditService } from './CreditService.js';
import { HttpError } from '../middleware/errorHandler.js';
import { sequelize } from '../shared/db.js';

export interface Coordinates {
    row: number;
    column: number;
}

export class ModelExecutionService {
    private creditService = new CreditService();

    async executeModel(
        userId: number,
        modelId: string,
        start: Coordinates,
        goal: Coordinates
    ) {
        const transaction = await sequelize.transaction();

        try {
            const model = await GridModel.findOne({
                where: {
                    modelId,
                    valid: true
                },
                transaction
            });

            if (!model) {
                throw new HttpError(404, 'Model not found');
            }

            this.validateCoordinates(start, model);
            this.validateCoordinates(goal, model);

            if (
                model.matrix[start.row][start.column] !== 0 ||
                model.matrix[goal.row][goal.column] !== 0
            ) {
                throw new HttpError(
                    400,
                    'Start and goal must be walkable cells'
                );
            }

            const executionCost = Number(
                (model.rows * model.columns * 0.025).toFixed(2)
            );

            const finder = new AStarFinder({
                grid: {
                    matrix: model.matrix
                },
                diagonalAllowed: false
            });

            const startTime = performance.now();

            const rawPath = finder.findPath(
                { x: start.column, y: start.row },
                { x: goal.column, y: goal.row }
            );

            const executionTime = Math.round(
                performance.now() - startTime
            );

            const path = rawPath.map(point => ({
                row: point[1],
                column: point[0]
            }));

            if (path.length === 0) {
                throw new HttpError(404, 'No path found');
            }

            // Con celle non pesate, ogni movimento costa 1.
            const pathCost = path.length - 1;

            await this.creditService.checkAndConsume(
                userId,
                executionCost,
                transaction
            );

            const execution = await Execution.create({
                gridModelId: model.id,
                userId,
                start,
                goal,
                path,
                pathCost,
                executionTime
            }, { transaction });

            await transaction.commit();

            return {
                executionId: execution.id,
                modelId: model.modelId,
                start,
                goal,
                found: true,
                path,
                pathCost,
                executionCost,
                executionTimeMs: executionTime
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    private validateCoordinates(
        point: Coordinates,
        model: GridModel
    ): void {
        if (
            !Number.isInteger(point.row) ||
            !Number.isInteger(point.column) ||
            point.row < 0 ||
            point.column < 0 ||
            point.row >= model.rows ||
            point.column >= model.columns
        ) {
            throw new HttpError(
                400,
                'Start or goal is outside the grid'
            );
        }
    }
}