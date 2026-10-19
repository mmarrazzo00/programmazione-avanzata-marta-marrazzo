import { HttpError } from '../middleware/errorHandler.js';
import { GridModelDAO } from '../dao/GridModelDAO.js';
import { UpdateDAO } from '../dao/UpdateDAO.js';
import { UpdateRequestDAO } from '../dao/UpdateRequestDAO.js';

/**
 * Service responsabile dell'analisi delle richieste di aggiornamento.
 *
 * Permette di consultare lo storico delle richieste con filtri,
 * verificare la presenza di richieste pending per un modello
 * e recuperare le richieste in attesa relative ai modelli
 * posseduti da un utente.
 *
 * Utilizza i DAO per separare la logica applicativa
 * dalle interrogazioni al database.
 */
export class UpdateRequestAnalysisService {

    private gridModelDAO = new GridModelDAO();
    private updateDAO = new UpdateDAO();
    private updateRequestDAO = new UpdateRequestDAO();

    /**
     * Recupera lo storico delle richieste di aggiornamento
     * associate a tutte le versioni di un modello.
     *
     * Supporta filtri opzionali per intervallo temporale,
     * stato della richiesta e campo data da utilizzare.
     * Include le modifiche alle singole celle di ogni richiesta.
     *
     * @param modelId - Identificativo logico del modello.
     * @param FROM - Data iniziale opzionale.
     * @param TO - Data finale opzionale.
     * @param STATUS - Stato opzionale delle richieste.
     * @param DATE_TYPE - Campo temporale per il filtro e l'ordinamento.
     * @returns Lo storico delle richieste con le relative modifiche.
     */
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

        // Verifica che l'intervallo temporale sia coerente.
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
                'auto',
                'split'
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
        // Promise.all attende il completamento di tutte le ricerche.
        const result = await Promise.all(
            requests.map(async request => {
                const cellUpdates =
                    await this.updateDAO.findByRequestId(
                        request.id,
                        undefined,
                        false,
                        [   'id',
                            'row',
                            'column',
                            'oldValue',
                            'newValue'
                        ]
                    );

                // Combina i dati della richiesta con le modifiche associate.
                return {
                    ...request.toJSON(),
                    updates: cellUpdates.map(update => update.toJSON())
                };
            })
        );

        return result;
    }

    /**
     * Recupera lo stato delle richieste pending di un modello.
     *
     * Considera tutte le versioni associate al modelId
     * e restituisce la presenza, il numero e un riepilogo
     * delle richieste ancora in attesa.
     *
     * @param modelId - Identificativo logico del modello.
     * @returns Riepilogo delle richieste pending.
     */
    async getModelPendingStatus(modelId: string) {

        // Recupera tutte le versioni del modello
        const versions =
            await this.gridModelDAO.findVersionsByModelId(modelId);

        if (versions.length === 0) {
            throw new HttpError(404, 'Model not found');
        }

        const versionIds = versions.map(version => version.id);

        // Recupera le richieste ancora in attesa
        // Seleziona soltanto gli attributi necessari al riepilogo.
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

    /**
     * Recupera le richieste pending relative ai modelli
     * di proprietà dell'utente indicato.
     *
     * Per ogni richiesta include anche le modifiche
     * proposte alle singole celle.
     *
     * @param userId - Identificativo del proprietario dei modelli.
     * @returns Elenco delle richieste pending con le relative modifiche.
     */
    async getMyPendingRequests(userId: number) {

        // Recupera i modelli posseduti dall'utente
        const models =
            await this.gridModelDAO.findOwnedByUserId(userId);

        const modelIds = models.map(model => model.id);

        // Se l'utente non possiede modelli, restituisce un elenco vuoto.
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
                            'id',
                            'row',
                            'column',
                            'oldValue',
                            'newValue',
                            'createdAt'
                        ]
                    );

                // Associa a ogni richiesta l'elenco delle modifiche proposte.
                return {
                    ...request.toJSON(),
                    updates: updates.map(update => update.toJSON())
                };
            })
        );

        return result;
    }

}
