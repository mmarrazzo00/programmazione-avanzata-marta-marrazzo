
import { GridModel } from '../models/GridModel.js';
import { HttpError } from '../middleware/errorHandler.js';
import { Update } from '../models/Update.js';
import { UpdateRequest } from '../models/UpdateRequest.js';
import { Op, WhereOptions } from 'sequelize';

export interface CellUpdate {
    row: number;
    column: number;
    newValue: number;
}

export interface CellDecision {
    updateId: number;
    decision: 'accepted' | 'rejected';
}

export class UpdateRequestAnalysisService {

    async getUpdates(
        modelId: string,
        FROM?: string,
        TO?: string,
        STATUS?: string,
        DATE_TYPE: 'createdAt' | 'updatedAt' = 'createdAt'
    ) {
        // Recupera tutte le versioni del modello logico
        const versions = await GridModel.findAll({
            where: { modelId },
            attributes: ['id']
        });

        const versionIds = versions.map(version => version.id);

        if (versionIds.length === 0) {
            throw new HttpError(404, 'Model not found');
        }

        // Filtra le richieste per tutte le versioni del modello
        const where: WhereOptions = {
            gridModelId: {
                [Op.in]: versionIds
            }
        };

        // Controlla che il tipo di data sia valido
        if (DATE_TYPE !== 'createdAt' && DATE_TYPE !== 'updatedAt') {
            throw new HttpError(400, 'Invalid date type');
        }

        // Costruisce il filtro temporale
        const dateFilter: Record<symbol, Date> = {};

        if (FROM) {
            const fromDate = new Date(FROM);

            if (Number.isNaN(fromDate.getTime())) {
                throw new HttpError(400, 'Invalid FROM date');
            }

            dateFilter[Op.gte] = fromDate;
        }

        if (TO) {
            const toDate = new Date(TO);

            if (Number.isNaN(toDate.getTime())) {
                throw new HttpError(400, 'Invalid TO date');
            }

            dateFilter[Op.lte] = toDate;
        }

        if (FROM && TO && new Date(FROM) > new Date(TO)) {
            throw new HttpError(400, 'FROM date must be before or equal to TO date');
        }

        if (FROM || TO) {
            Object.assign(where, {
                [DATE_TYPE]: dateFilter
            });
        }

        // Filtra per stato, se specificato
        if (STATUS) {
            const allowedStatuses = [
                'accepted',
                'rejected',
                'pending',
                'auto'
            ];

            if (!allowedStatuses.includes(STATUS)) {
                throw new HttpError(400, 'Invalid status');
            }

            Object.assign(where, { status: STATUS });
        }

        // Recupera le richieste ordinate dalla più recente
        const requests = await UpdateRequest.findAll({
            where,
            order: [[DATE_TYPE, 'DESC']]
        });

        // Recupera le modifiche alle singole celle di ogni richiesta
        const result = await Promise.all(
            requests.map(async request => {
                const cellUpdates = await Update.findAll({
                    where: {
                        updateRequestId: request.id
                    },
                    attributes: [
                        'row',
                        'column',
                        'oldValue',
                        'newValue'
                    ]
                });

                return {
                    ...request.toJSON(),
                    updates: cellUpdates.map(update => update.toJSON())
                };
            })
        );

        return result;
    }

    async getModelPendingStatus(modelId: string) {

        // Recupera tutte le versioni del modello
        const versions = await GridModel.findAll({
            where: { modelId },
            attributes: ['id']
        });

        if (versions.length === 0) {
            throw new HttpError(404, 'Model not found');
        }

        const versionIds = versions.map(version => version.id);

        // Cerca le richieste ancora in attesa
        const pendingRequests = await UpdateRequest.findAll({
            where: {
                gridModelId: {
                    [Op.in]: versionIds
                },
                status: 'pending'
            },
            attributes: [
                'id',
                'userId',
                'gridModelId',
                'status',
                'createdAt'
            ],
            order: [['createdAt', 'DESC']]
        });

        return {
            modelId,
            hasPendingRequests: pendingRequests.length > 0,
            pendingCount: pendingRequests.length,
            pendingRequests
        };
    }

    async getMyPendingRequests(userId: number) {
        // Recupera i modelli posseduti dall'utente
        const models = await GridModel.findAll({
            where: { ownerId: userId },
            attributes: ['id', 'modelId', 'name', 'version']
        });

        const modelIds = models.map(model => model.id);

        if (modelIds.length === 0) {
            return [];
        }

        // Recupera le richieste pending dei suoi modelli
        const pendingRequests = await UpdateRequest.findAll({
            where: {
                gridModelId: {
                    [Op.in]: modelIds
                },
                status: 'pending'
            },
            order: [['createdAt', 'DESC']]
        });

        // Per ogni richiesta recupera le modifiche alle celle
        const result = await Promise.all(
            pendingRequests.map(async request => {
                const updates = await Update.findAll({
                    where: {
                        updateRequestId: request.id
                    },
                    attributes: [
                        'row',
                        'column',
                        'oldValue',
                        'newValue',
                        'createdAt'
                    ]
                });

                return {
                    ...request.toJSON(),
                    updates: updates.map(update => update.toJSON())
                };
            })
        );

        return result;
    }
}