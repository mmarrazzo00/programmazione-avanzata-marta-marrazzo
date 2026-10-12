import { HttpError } from '../middleware/errorHandler.js';
import { GridModelDAO } from '../dao/GridModelDAO.js';
import { UpdateDAO } from '../dao/UpdateDAO.js';
import { UpdateRequestDAO } from '../dao/UpdateRequestDAO.js';

export class UpdateRequestAnalysisService {

    private gridModelDAO = new GridModelDAO();
    private updateDAO = new UpdateDAO();
    private updateRequestDAO = new UpdateRequestDAO();

    async getUpdates(
        modelId: string,
        FROM?: string,
        TO?: string,
        STATUS?: string,
        DATE_TYPE: 'createdAt' | 'updatedAt' = 'createdAt'
    ) {
        // Controlla il tipo di data
        if (DATE_TYPE !== 'createdAt' && DATE_TYPE !== 'updatedAt') {
            throw new HttpError(400, 'Invalid date type');
        }

        // Valida le date ricevute
        let fromDate: Date | undefined;
        let toDate: Date | undefined;

        if (FROM) {
            fromDate = new Date(FROM);

            if (Number.isNaN(fromDate.getTime())) {
                throw new HttpError(400, 'Invalid FROM date');
            }
        }

        if (TO) {
            toDate = new Date(TO);

            if (Number.isNaN(toDate.getTime())) {
                throw new HttpError(400, 'Invalid TO date');
            }
        }

        if (fromDate && toDate && fromDate > toDate) {
            throw new HttpError(
                400,
                'FROM date must be before or equal to TO date'
            );
        }

        // Valida lo stato, se specificato
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
        }

        // Recupera gli ID di tutte le versioni del modello
        const versions =
            await this.gridModelDAO.findVersionsByModelId(modelId);

        const versionIds = versions.map(version => version.id);

        if (versionIds.length === 0) {
            throw new HttpError(404, 'Model not found');
        }

        // Recupera le richieste applicando i filtri
        const requests = await this.updateRequestDAO.findByVersionIds(
            versionIds,
            {
                fromDate,
                toDate,
                dateType: DATE_TYPE,
                status: STATUS
            }
        );

        // Recupera le modifiche delle celle per ogni richiesta
        const result = await Promise.all(
            requests.map(async request => {
                const cellUpdates =
                    await this.updateDAO.findByRequestId(
                        request.id,
                        undefined,
                        false,
                        [
                            'row',
                            'column',
                            'oldValue',
                            'newValue'
                        ]
                    );

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
        const versions =
            await this.gridModelDAO.findVersionsByModelId(modelId);

        if (versions.length === 0) {
            throw new HttpError(404, 'Model not found');
        }

        const versionIds = versions.map(version => version.id);

        // Recupera le richieste ancora in attesa
        const pendingRequests =
            await this.updateRequestDAO.findPendingByVersionIds(
                versionIds,
                true
            );

        return {
            modelId,
            hasPendingRequests: pendingRequests.length > 0,
            pendingCount: pendingRequests.length,
            pendingRequests
        };
    }

    async getMyPendingRequests(userId: number) {

        // Recupera i modelli posseduti dall'utente
        const models =
            await this.gridModelDAO.findOwnedByUserId(userId);

        const modelIds = models.map(model => model.id);

        if (modelIds.length === 0) {
            return [];
        }

        // Recupera le richieste pending relative ai suoi modelli
        const pendingRequests =
            await this.updateRequestDAO.findPendingByVersionIds(modelIds);

        // Recupera le modifiche alle celle di ogni richiesta
        const result = await Promise.all(
            pendingRequests.map(async request => {
                const updates =
                    await this.updateDAO.findByRequestId(
                        request.id,
                        undefined,
                        false,
                        [
                            'row',
                            'column',
                            'oldValue',
                            'newValue',
                            'createdAt'
                        ]
                    );

                return {
                    ...request.toJSON(),
                    updates: updates.map(update => update.toJSON())
                };
            })
        );

        return result;
    }

}
