import { Request, Response, NextFunction } from 'express';
import { ModelExecutionService } from '../services/ModelExecutionService.js';

/**
 * Controller responsabile dell'esecuzione del pathfinding.
 *
 * Riceve i parametri della richiesta HTTP e delega
 * la logica di esecuzione a ModelExecutionService.
 */
export class ModelExecutionController {
    private modelExecutionService = new ModelExecutionService();

    /**
     * Gestisce la richiesta di esecuzione del pathfinding.
     *
     * Recupera l'utente autenticato, il modello da eseguire
     * e le coordinate iniziali e finali del percorso.
     *
     * Eventuali errori vengono inoltrati al middleware globale.
     */
    async execute(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            // Recupera l'identificativo dell'utente dal JWT verificato.
            const userId = req.user!.userId;

            // Identifica il modello da eseguire tramite il parametro della rotta.
            const modelId = String(req.params.modelId);

            // Estrae le coordinate di partenza e destinazione dal body.
            const { start, goal } = req.body;

            // Delega al Service l'esecuzione dell'algoritmo di pathfinding.
            const result = await this.modelExecutionService.executeModel(
                userId,
                modelId,
                start,
                goal
            );

            // Restituisce il risultato dell'esecuzione con HTTP 200.
            res.status(200).json(result);
        } catch (error) {
            // Propaga eventuali errori al middleware centralizzato.
            next(error);
        }
    }
}
