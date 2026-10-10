import { Request, Response, NextFunction } from 'express';
import { UpdateRequestService } from '../services/UpdateRequestService.js';

export class UpdateRequestController {

    private updateRequestService = new UpdateRequestService();

    async create(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user!.userId;
            const modelId = String(req.params.modelId);
            const updates = req.body;

            const result =
                await this.updateRequestService.createUpdateRequest(
                    userId,
                    modelId,
                    updates
                );

            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async decide(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const requestId = Number(req.params.requestId);
            const ownerId = req.user!.userId;
            const { accept } = req.body;

            const result =
                await this.updateRequestService.decideUpdateRequest(
                    requestId,
                    ownerId,
                    accept
                );

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

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
                await this.updateRequestService.getUpdates(
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
}