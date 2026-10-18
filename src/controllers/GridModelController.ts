import { Request, Response, NextFunction } from 'express';
import { GridModelService } from '../services/GridModelService.js';

/**
 * Controller responsabile della gestione delle richieste HTTP
 * relative ai modelli a griglia.
 *
 * Delega la logica applicativa a GridModelService
 * e inoltra eventuali errori al middleware globale.
 */
export class GridModelController {
    private gridModelService = new GridModelService();

    /**
     * Gestisce la creazione di un nuovo modello a griglia.
     *
     * Recupera l'identificativo dell'utente autenticato
     * e i dati del modello dal body della richiesta.
     *
     * @returns HTTP 201 con il modello creato.
     */
    async create(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            // Recupera l'identificativo dell'utente dal JWT verificato.
            const userId = req.user!.userId;

            // Estrae i dati necessari alla creazione del modello.
            const { modelId, name, matrix } = req.body;

            // Delega al Service la creazione del modello.
            const model = await this.gridModelService.createModel(
                userId,
                modelId,
                name,
                matrix
            );

            // Restituisce il modello creato con stato HTTP 201.
            res.status(201).json(model);
        } catch (error) {
            // Inoltra eventuali errori al middleware globale errorHandler.
            next(error);
        }
    }
}
