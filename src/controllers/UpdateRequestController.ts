import { Request, Response, NextFunction } from 'express';
import { UpdateRequestService } from '../services/UpdateRequestService.js';
import { HttpError } from '../middleware/errorHandler.js';

/**
 * Controller responsabile della gestione delle richieste
 * di aggiornamento dei modelli a griglia.
 *
 * Permette di creare nuove richieste e di gestire
 * le decisioni di accettazione o rifiuto, anche parziali.
 * Delega la logica applicativa a UpdateRequestService.
 */
export class UpdateRequestController {

    private updateRequestService = new UpdateRequestService();

    /**
     * Gestisce la creazione di una richiesta di aggiornamento.
     *
     * Recupera l'utente autenticato, il modello interessato
     * e le modifiche proposte nel body della richiesta.
     */
    async create(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            // Identifica l'utente che propone le modifiche.
            const userId = req.user!.userId;

            // Recupera l'identificativo del modello dalla rotta.
            const modelId = String(req.params.modelId);

            // Recupera le modifiche proposte dal body HTTP.
            const updates = req.body;

            // Delega al Service la creazione della richiesta.
            const result =
                await this.updateRequestService.createUpdateRequest(
                    userId,
                    modelId,
                    updates
                );

            // Restituisce la richiesta creata con stato HTTP 201.
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Gestisce la decisione complessiva su una richiesta
     * di aggiornamento.
     *
     * L'utente proprietario del modello può accettare
     * oppure rifiutare la richiesta.
     */
    async decide(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            // Identifica la richiesta e l'utente che prende la decisione.
            const requestId = Number(req.params.requestId);
            const ownerId = req.user!.userId;

            // Recupera la decisione di accettazione o rifiuto.
            const { accept } = req.body;

            // Delega al Service l'elaborazione della decisione.
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

    /**
     * Gestisce le decisioni sulle singole celle di una richiesta.
     *
     * Se tutte le celle hanno la stessa decisione, utilizza
     * la gestione complessiva della richiesta.
     * Se le decisioni sono miste, delega al Service
     * la suddivisione della richiesta.
     */
    async decideCells(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const requestId = Number(req.params.requestId);
            const ownerId = req.user!.userId;
            const { decisions } = req.body;

            // Verifica che sia presente almeno una decisione.
            if (!Array.isArray(decisions) || decisions.length === 0) {
                throw new HttpError(
                    400,
                    'At least one cell decision is required'
                );
            }

            // Controlla se tutte le modifiche sono state accettate.
            const allAccepted = decisions.every(
                (d: { decision: string }) => d.decision === 'accepted'
            );

            // Controlla se tutte le modifiche sono state rifiutate.
            const allRejected = decisions.every(
                (d: { decision: string }) => d.decision === 'rejected'
            );

            let result;

            // Una decisione uniforme viene gestita sull'intera richiesta.
            if (allAccepted || allRejected) {
                result =
                    await this.updateRequestService.decideUpdateRequest(
                        requestId,
                        ownerId,
                        allAccepted
                    );
            } else {
                // Decisioni miste richiedono la suddivisione
                // della richiesta in base alle singole celle.
                result =
                    await this.updateRequestService.splitUpdateRequest(
                        requestId,
                        ownerId,
                        decisions
                    );
            }

            res.status(200).json(result);
        } catch (error) {
            // Inoltra eventuali errori al middleware globale.
            next(error);
        }
    }


}
