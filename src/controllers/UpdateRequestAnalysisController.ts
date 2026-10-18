import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../middleware/errorHandler.js';
import { UpdateRequestAnalysisService } from '../services/UpdateRequestAnalysisService.js';

/**
 * Controller dedicato all'analisi delle richieste di aggiornamento.
 *
 * Gestisce le richieste HTTP per la consultazione dello storico
 * degli aggiornamenti e delle richieste ancora in attesa.
 * Delega la logica applicativa a UpdateRequestAnalysisService.
 */
export class UpdateRequestAnalysisController {

    private updateRequestAnalysisService = new UpdateRequestAnalysisService();

    /**
     * Recupera lo storico degli aggiornamenti di un modello,
     * applicando eventuali filtri per data e stato.
     *
     * I parametri FROM, TO, STATUS e DATE_TYPE sono opzionali.
     * DATE_TYPE indica il campo temporale da utilizzare per il filtro.
     */
    async getUpdates(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            // Identifica il modello attraverso il parametro della rotta.
            const modelId = String(req.params.modelId);

            // Recupera i filtri opzionali dalla query string.
            const FROM = req.query.FROM as string | undefined;
            const TO = req.query.TO as string | undefined;
            const STATUS = req.query.STATUS as string | undefined;
            const DATE_TYPE = req.query.DATE_TYPE as
                | 'createdAt'
                | 'updatedAt'
                | undefined;

            // Delega al Service il recupero dei dati filtrati.
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

    /**
     * Recupera lo stato delle richieste di aggiornamento
     * ancora in attesa per uno specifico modello.
     */
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

    /**
     * Recupera le richieste di aggiornamento in attesa
     * associate all'utente autenticato, secondo i criteri
     * definiti dal Service.
     */
    async getMyPendingRequests(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            // Recupera l'identificativo dell'utente dal JWT verificato.
            const userId = req.user!.userId;

            // Verifica che l'identificativo sia un intero positivo.
            if (!Number.isInteger(userId) || userId <= 0) {
                throw new HttpError(401, 'Invalid authenticated user');
            }

            const result =
                await this.updateRequestAnalysisService.getMyPendingRequests(
                    userId
                );

            res.status(200).json(result);
        } catch (error) {
            // Inoltra eventuali errori al middleware globale errorHandler.
            next(error);
        }
    }

}
