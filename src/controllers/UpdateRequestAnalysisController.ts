import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../middleware/errorHandler.js';
import { UpdateRequestAnalysisService } from '../services/UpdateRequestAnalysisService.js';

export class UpdateRequestAnalysisController {

    private updateRequestAnalysisService = new UpdateRequestAnalysisService();

    async getUpdates(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const modelId = String(req.params.modelId);

            const FROM = req.query.FROM as string | undefined;
            const TO = req.query.TO as string | undefined;
            const STATUS = req.query.STATUS as string | undefined;
            const DATE_TYPE = req.query.DATE_TYPE as
                | 'createdAt'
                | 'updatedAt'
                | undefined;

            const result =
                await this.updateRequestAnalysisService.getUpdates(
                    modelId,
                    FROM,
                    TO,
                    STATUS,
                    DATE_TYPE
                );

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getModelPendingStatus(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const modelId = String(req.params.modelId);

            const result =
                await this.updateRequestAnalysisService.getModelPendingStatus(
                    modelId
                );

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getMyPendingRequests(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user!.userId;

            if (!Number.isInteger(userId) || userId <= 0) {
                throw new HttpError(401, 'Invalid authenticated user');
            }

            const result =
                await this.updateRequestAnalysisService.getMyPendingRequests(
                    userId
                );

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

}