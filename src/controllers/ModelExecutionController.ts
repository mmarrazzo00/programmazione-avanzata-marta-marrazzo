
import { Request, Response, NextFunction } from 'express';
import { ModelExecutionService } from '../services/ModelExecutionService.js';

export class ModelExecutionController {
    private modelExecutionService = new ModelExecutionService();

    async execute(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user!.userId;
            const modelId = String(req.params.modelId);
            const { start, goal } = req.body;

            const result = await this.modelExecutionService.executeModel(
                userId,
                modelId,
                start,
                goal
            );

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}