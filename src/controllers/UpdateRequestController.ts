import { Request, Response, NextFunction } from 'express';
import { UpdateRequestService } from '../services/UpdateRequestService.js';
import { HttpError } from '../middleware/errorHandler.js';

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

    async decideCells(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const requestId = Number(req.params.requestId);
            const ownerId = req.user!.userId;
            const { decisions } = req.body;

            if (!Array.isArray(decisions) || decisions.length === 0) {
                throw new HttpError(
                    400,
                    'At least one cell decision is required'
                );
            }

            const allAccepted = decisions.every(
                (d: { decision: string }) => d.decision === 'accepted'
            );

            const allRejected = decisions.every(
                (d: { decision: string }) => d.decision === 'rejected'
            );

            let result;

            if (allAccepted || allRejected) {
                result =
                    await this.updateRequestService.decideUpdateRequest(
                        requestId,
                        ownerId,
                        allAccepted
                    );
            } else {
                result =
                    await this.updateRequestService.splitUpdateRequest(
                        requestId,
                        ownerId,
                        decisions
                    );
            }

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }


}