import { Transaction } from 'sequelize';
import { Execution } from '../models/Execution.js';

interface Coordinates {
    row: number;
    column: number;
}

interface CreateExecutionData {
    gridModelId: number;
    userId: number;
    start: Coordinates;
    goal: Coordinates;
    path: Coordinates[];
    pathCost: number;
    executionTime: number;
}

export class ExecutionDAO {
    async create(
        data: CreateExecutionData,
        transaction?: Transaction
    ): Promise<Execution> {
        return Execution.create(
            {
                gridModelId: data.gridModelId,
                userId: data.userId,
                start: data.start,
                goal: data.goal,
                path: data.path,
                pathCost: data.pathCost,
                executionTime: data.executionTime
            },
            { transaction }
        );
    }
}
