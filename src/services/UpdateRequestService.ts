import { GridModel } from '../models/GridModel.js';
import { CreditService } from './CreditService.js';
import { HttpError } from '../middleware/errorHandler.js';
import { Update } from '../models/Update.js';
import { UpdateRequest } from '../models/UpdateRequest.js';
import { sequelize } from '../shared/db.js';
import { Transaction } from 'sequelize';
import { GridModelDAO } from '../dao/GridModelDAO.js';
import { UpdateDAO } from '../dao/UpdateDAO.js';
import { UpdateRequestDAO } from '../dao/UpdateRequestDAO.js';

/** Coordinate e nuovo valore di una cella da modificare. */
export interface CellUpdate {
    row: number;
    column: number;
    newValue: number;
}

/** Modifica validata, arricchita con il valore originale della cella. */
interface PreparedCellUpdate {
    row: number;
    column: number;
    oldValue: number;
    newValue: number;
}

/** Decisione del proprietario su una singola modifica identificata da updateId. */
export interface CellDecision {
    updateId: number;
    decision: 'accepted' | 'rejected';
}

/**
 * Coordina proposte di modifica, approvazioni e rifiuti.
 * Gestisce anche aggiornamenti automatici del proprietario,
 * versionamento delle griglie, addebiti e decisioni parziali.
 * Le operazioni di persistenza sono delegate ai DAO.
 */
export class UpdateRequestService {

    private creditService = new CreditService();
    private gridModelDAO = new GridModelDAO();
    private updateDAO = new UpdateDAO();
    private updateRequestDAO = new UpdateRequestDAO();

    /**
     * Crea una richiesta di aggiornamento sulla versione valida del modello.
     * Le modifiche del proprietario sono applicate immediatamente (stato auto),
     * mentre quelle degli altri utenti rimangono pending, senza addebito immediato.
     */
    async createUpdateRequest(
        userId: number,
        modelId: string,
        updates: CellUpdate[]
    ): Promise<UpdateRequest> {
        // Usa la versione attiva e prepara modifiche con i rispettivi valori originali.
        const model = await this.findValidModel(modelId);
        const cellUpdates = this.validateAndPrepareUpdates(model, updates);
        const cost = this.calculateUpdateCost(cellUpdates.length);
        const transaction = await sequelize.transaction();

        try {
            // La proprietà del modello determina il flusso automatico o pending.
            const isOwner = model.ownerId === userId;

            const request = await this.createUpdateRequestRecord(
                userId,
                model,
                cellUpdates,
                cost,
                isOwner,
                transaction
            );

            // Il proprietario paga e genera subito una nuova versione della griglia.
            if (isOwner) {
                await this.creditService.checkAndConsume(
                    userId,
                    cost,
                    transaction
                );
                await this.applyDirectUpdate(
                    model,
                    cellUpdates,
                    transaction
                );
            }

            await transaction.commit();
            return request;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Accetta o rifiuta integralmente una richiesta pending.
     * Solo il proprietario può decidere; l'accettazione richiede una versione
     * ancora valida, celle inalterate e credito sufficiente del proponente.
     */
    async decideUpdateRequest(
        requestId: number,
        ownerId: number,
        accept: boolean
    ): Promise<UpdateRequest> {
        const transaction = await sequelize.transaction();

        try {
            const request = await this.findPendingRequest(
                requestId,
                transaction
            );

            const model = await this.findRequestModel(
                request.gridModelId,
                transaction
            );

            this.checkModelOwner(model, ownerId);

            // Il rifiuto aggiorna soltanto stato e data, senza addebito.
            if (!accept) {
                request.status = 'rejected';
                request.decidedAt = new Date();

                await this.updateRequestDAO.save(request, transaction);
                await transaction.commit();

                return request;
            }

            // Non è possibile applicare modifiche a una versione superata.
            if (!model.valid) {
                throw new HttpError(
                    409,
                    'Cannot approve a request for an outdated model version'
                );
            }

            const updates = await this.findRequestUpdates(
                request.id,
                transaction
            );

            const cellUpdates = this.prepareStoredUpdates(updates);

            // Verifica che le celle non siano cambiate rispetto
            // alla versione sulla quale era stata creata la richiesta.
            for (const update of cellUpdates) {
                const currentValue =
                    model.matrix[update.row]?.[update.column];

                if (currentValue !== update.oldValue) {
                    throw new HttpError(
                        409,
                        'The requested cells have changed since the request was created'
                    );
                }
            }

            // Il costo grava sull'utente che ha proposto la modifica.
            await this.creditService.checkAndConsume(
                request.userId,
                Number(request.cost),
                transaction
            );

            await this.applyDirectUpdate(
                model,
                cellUpdates,
                transaction
            );

            request.status = 'accepted';
            request.decidedAt = new Date();

            await this.updateRequestDAO.save(request, transaction);
            await transaction.commit();
            return request;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Gestisce decisioni miste su singole celle.
     * Verifica che ogni modifica abbia una sola decisione, applica e addebita
     * esclusivamente quelle accettate e crea richieste figlie per lo storico.
     */
    async splitUpdateRequest(
        requestId: number,
        ownerId: number,
        decisions: CellDecision[]
    ): Promise<{
        originalRequest: UpdateRequest;
        childRequests: UpdateRequest[];
    }> {
        if (!Array.isArray(decisions) || decisions.length === 0) {
            throw new HttpError(400, 'At least one cell decision is required');
        }

        // Individua identificativi o decisioni non validi e ID duplicati.
        const updateIds = decisions.map(d => d.updateId);

        if (
            decisions.some(
                d =>
                    !Number.isInteger(d.updateId) ||
                    d.updateId <= 0 ||
                    !['accepted', 'rejected'].includes(d.decision)
            ) ||
            new Set(updateIds).size !== updateIds.length
        ) {
            throw new HttpError(400, 'Invalid or duplicated cell decisions');
        }

        const transaction = await sequelize.transaction();

        try {
            const request = await this.findPendingRequest(
                requestId,
                transaction
            );

            const model = await this.findRequestModel(
                request.gridModelId,
                transaction
            );

            this.checkModelOwner(model, ownerId);

            // Conserviamo l'ID della versione originale per lo storico.
            const originalGridModelId = model.id;

            const updates = await this.updateDAO.findByRequestId(
                request.id,
                transaction,
                true
            );

            if (updates.length === 0) {
                throw new HttpError(400, 'No cell updates found for this request');
            }

            // La mappa consente di verificare rapidamente gli ID delle modifiche.
            const updatesById = new Map(
                updates.map(update => [update.id, update])
            );

            // Verifica che ogni decisione appartenga a questa richiesta.
            for (const decision of decisions) {
                if (!updatesById.has(decision.updateId)) {
                    throw new HttpError(
                        400,
                        `Update ${decision.updateId} does not belong to this request`
                    );
                }
            }

            // Non è possibile lasciare modifiche senza una decisione.
            if (decisions.length !== updates.length) {
                throw new HttpError(
                    400,
                    'Every cell update must have a decision'
                );
            }

            const decisionsById = new Map(
                decisions.map(d => [d.updateId, d.decision])
            );

            // Suddivide le modifiche nei due gruppi da registrare separatamente.
            const acceptedUpdates: Update[] = [];
            const rejectedUpdates: Update[] = [];

            for (const update of updates) {
                const decision = decisionsById.get(update.id);

                if (decision === 'accepted') {
                    acceptedUpdates.push(update);
                } else if (decision === 'rejected') {
                    rejectedUpdates.push(update);
                } else {
                    throw new HttpError(
                        400,
                        `Missing decision for update ${update.id}`
                    );
                }
            }

            // Applichiamo e addebitiamo esclusivamente le modifiche accettate.
            if (acceptedUpdates.length > 0) {
                if (!model.valid) {
                    throw new HttpError(
                        409,
                        'Cannot approve a request for an outdated model version'
                    );
                }

                const acceptedCells =
                    this.prepareStoredUpdates(acceptedUpdates);

                for (const cell of acceptedCells) {
                    const currentValue =
                        model.matrix[cell.row]?.[cell.column];

                    if (currentValue !== cell.oldValue) {
                        throw new HttpError(
                            409,
                            'The requested cells have changed since the request was created'
                        );
                    }
                }

                const acceptedCost = this.calculateUpdateCost(
                    acceptedUpdates.length
                );

                await this.creditService.checkAndConsume(
                    request.userId,
                    acceptedCost,
                    transaction
                );

                await this.applyDirectUpdate(
                    model,
                    acceptedCells,
                    transaction
                );
            }

            const childRequests: UpdateRequest[] = [];
            const now = new Date();

            // Ogni gruppo non vuoto diventerà una richiesta figlia.
            const groups: {
                updates: Update[];
                status: 'accepted' | 'rejected';
            }[] = [
                    {
                        updates: acceptedUpdates,
                        status: 'accepted'
                    },
                    {
                        updates: rejectedUpdates,
                        status: 'rejected'
                    }
                ];

            for (const group of groups) {
                if (group.updates.length === 0) {
                    continue;
                }

                const childCost = this.calculateUpdateCost(
                    group.updates.length
                );

                // Le richieste figlie mantengono il riferimento alla versione originale.
                const child = await this.updateRequestDAO.create(
                    {
                        userId: request.userId,
                        gridModelId: originalGridModelId,
                        parentRequestId: request.id,
                        cost: childCost,
                        status: group.status,
                        decidedAt: now
                    },
                    transaction
                );


                await this.updateDAO.createMany(
                    group.updates.map(update => ({
                        updateRequestId: child.id,
                        row: update.row,
                        column: update.column,
                        oldValue: update.oldValue,
                        newValue: update.newValue
                    })),
                    transaction
                );


                childRequests.push(child);
            }

            // La richiesta originale rimane nello storico.
            request.status = 'split';
            request.decidedAt = now;

            await this.updateRequestDAO.save(request, transaction);
            await transaction.commit();

            return {
                originalRequest: request,
                childRequests
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /** Recupera la versione valida del modello oppure segnala HTTP 404. */
    private async findValidModel(
        modelId: string
    ): Promise<GridModel> {
        const model =
            await this.gridModelDAO.findValidByModelId(modelId);

        if (!model) {
            throw new HttpError(404, 'Model not found');
        }

        return model;
    }

    /**
     * Valida coordinate, valori e assenza di duplicati.
     * Memorizza anche il valore precedente per verifiche successive di coerenza.
     */
    private validateAndPrepareUpdates(
        model: GridModel,
        updates: CellUpdate[]
    ): PreparedCellUpdate[] {
        if (!Array.isArray(updates) || updates.length === 0) {
            throw new HttpError(
                400,
                'At least one cell update is required'
            );
        }

        const cellUpdates: PreparedCellUpdate[] = [];
        // Le coordinate serializzate permettono di rilevare celle duplicate.
        const seenCells = new Set<string>();

        for (const update of updates) {
            if (
                !Number.isInteger(update.row) ||
                !Number.isInteger(update.column) ||
                !Number.isInteger(update.newValue) ||
                update.row < 0 ||
                update.column < 0 ||
                (update.newValue !== 0 && update.newValue !== 1)
            ) {
                throw new HttpError(400, 'Invalid cell update');
            }

            if (
                update.row >= model.rows ||
                update.column >= model.columns
            ) {
                throw new HttpError(
                    400,
                    'Cell position is outside the matrix'
                );
            }

            const cellKey = `${update.row},${update.column}`;

            if (seenCells.has(cellKey)) {
                throw new HttpError(
                    400,
                    'A cell cannot be updated more than once in the same request'
                );
            }

            seenCells.add(cellKey);

            const oldValue =
                model.matrix[update.row][update.column];

            if (oldValue === update.newValue) {
                throw new HttpError(
                    400,
                    'New value must be different from current value'
                );
            }

            cellUpdates.push({
                row: update.row,
                column: update.column,
                oldValue,
                newValue: update.newValue
            });
        }

        return cellUpdates;
    }

    /** Calcola il costo delle modifiche: 0,35 crediti per cella. */
    private calculateUpdateCost(numberOfCells: number): number {
        return Number((0.35 * numberOfCells).toFixed(2));
    }

    /**
     * Registra la richiesta e tutte le modifiche nella stessa transazione.
     * Il proprietario genera una richiesta auto; gli altri utenti una pending.
     */
    private async createUpdateRequestRecord(
        userId: number,
        model: GridModel,
        cellUpdates: PreparedCellUpdate[],
        cost: number,
        isOwner: boolean,
        transaction: Transaction
    ): Promise<UpdateRequest> {
        const request = await this.updateRequestDAO.create(
            {
                userId,
                gridModelId: model.id,
                cost,
                status: isOwner ? 'auto' : 'pending',
                decidedAt: isOwner ? new Date() : null
            },
            transaction
        );

        await this.updateDAO.createMany(
            cellUpdates.map(cell => ({
                updateRequestId: request.id,
                row: cell.row,
                column: cell.column,
                oldValue: cell.oldValue,
                newValue: cell.newValue
            })),
            transaction
        );

        return request;
    }

    /**
     * Applica le modifiche su una copia della matrice, invalida la versione
     * precedente e crea la versione successiva all'interno della transazione.
     */
    private async applyDirectUpdate(
        model: GridModel,
        cellUpdates: PreparedCellUpdate[],
        transaction: Transaction
    ): Promise<GridModel> {
        // Copia righe e matrice per non modificare direttamente quella originale.
        const newMatrix = model.matrix.map(row => [...row]);

        for (const update of cellUpdates) {
            newMatrix[update.row][update.column] = update.newValue;
        }

        // Solo la nuova versione risulta valida dopo il salvataggio.
        model.valid = false;

        await this.gridModelDAO.save(model, transaction);

        return this.gridModelDAO.create(
            {
                modelId: model.modelId,
                name: model.name,
                ownerId: model.ownerId,
                rows: model.rows,
                columns: model.columns,
                matrix: newMatrix,
                version: model.version + 1,
                valid: true
            },
            transaction
        );
    }

    /** Ricerca e blocca una richiesta pending nella transazione corrente. */
    private async findPendingRequest(
        requestId: number,
        transaction: Transaction
    ): Promise<UpdateRequest> {
        const request =
            await this.updateRequestDAO.findPendingById(
                requestId,
                transaction
            );

        if (!request) {
            throw new HttpError(
                404,
                'Pending update request not found'
            );
        }

        return request;
    }

    /** Recupera con lock il record della versione a cui si riferisce la richiesta. */
    private async findRequestModel(
        gridModelId: number,
        transaction: Transaction
    ): Promise<GridModel> {
        const model = await this.gridModelDAO.findById(
            gridModelId,
            transaction,
            true
        );

        if (!model) {
            throw new HttpError(
                404,
                'Model associated with the request not found'
            );
        }

        return model;
    }

    /** Impedisce agli utenti diversi dal proprietario di decidere sulla richiesta. */
    private checkModelOwner(
        model: GridModel,
        ownerId: number
    ): void {
        if (model.ownerId !== ownerId) {
            throw new HttpError(
                403,
                'Only the model owner can decide this request'
            );
        }
    }

    /** Recupera le modifiche associate, rifiutando richieste senza celle. */
    private async findRequestUpdates(
        requestId: number,
        transaction: Transaction
    ): Promise<Update[]> {
        const updates = await this.updateDAO.findByRequestId(
            requestId,
            transaction
        );

        if (updates.length === 0) {
            throw new HttpError(
                400,
                'No cell updates found for this request'
            );
        }

        return updates;
    }

    /** Converte i record Update nel formato usato dalla logica applicativa. */
    private prepareStoredUpdates(
        updates: Update[]
    ): PreparedCellUpdate[] {
        return updates.map(update => ({
            row: update.row,
            column: update.column,
            oldValue: update.oldValue,
            newValue: update.newValue
        }));
    }

}