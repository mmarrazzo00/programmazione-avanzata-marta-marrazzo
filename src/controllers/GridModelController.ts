import { Request, Response, NextFunction } from 'express';
import { GridModelService } from '../services/GridModelService.js';

export class GridModelController {
    private gridModelService = new GridModelService();

    async create(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user!.userId;

            const { modelId, name, matrix } = req.body;

            const model = await this.gridModelService.createModel(
                userId,
                modelId,
                name,
                matrix
            );

            res.status(201).json(model);
        } catch (error) {
            next(error);
        }
    }
}