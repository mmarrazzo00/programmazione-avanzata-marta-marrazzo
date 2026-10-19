import { GridModel } from '../models/GridModel.js';
import { CreditService } from './CreditService.js';
import { GridModelDAO } from '../dao/GridModelDAO.js';
import { HttpError } from '../middleware/errorHandler.js';

/**
 * Service responsabile della creazione dei modelli a griglia.
 *
 * Verifica la struttura e i valori della matrice, calcola
 * il costo di creazione in base al numero di celle
 * e delega il consumo dei crediti e la persistenza
 * ai rispettivi componenti.
 */
export class GridModelService {

    private creditService = new CreditService();
    private gridModelDAO = new GridModelDAO();

    /**
     * Crea un nuovo modello a griglia associato all'utente.
     *
     * Ogni matrice deve essere rettangolare, non vuota
     * e contenere esclusivamente valori 0 e 1.
     * Il modello viene creato con versione iniziale 1.
     *
     * @param userId - Identificativo dell'utente proprietario.
     * @param modelId - Identificativo logico del modello.
     * @param name - Nome del modello.
     * @param matrix - Matrice bidimensionale della griglia.
     * @returns Il modello creato e salvato nel database.
     * @throws HttpError 400 se la matrice non è valida.
     */
    async createModel(
        userId: number,
        modelId: string,
        name: string,
        matrix: number[][]
    ): Promise<GridModel> {

        // Verifica che la matrice non sia vuota.
        if (matrix.length === 0) {
            throw new HttpError(400, 'Matrix cannot be empty');
        }

        // Determina il numero di colonne.
        const columns = matrix[0].length;

        if (columns === 0) {
            throw new HttpError(400, 'Matrix cannot have empty rows');
        }

        // Verifica che la matrice sia rettangolare.
        for (const row of matrix) {
            if (row.length !== columns) {
                throw new HttpError(400, 'Matrix must be rectangular');
            }
        }

        // Verifica i valori ammessi.
        for (const row of matrix) {
            for (const value of row) {
                if (value !== 0 && value !== 1) {
                    throw new HttpError(
                        400,
                        'Matrix values must be 0 or 1'
                    );
                }
            }
        }

        const rows = matrix.length;
        const numberOfCells = rows * columns;

        // Calcola il costo di creazione.
        const cost = Number((0.025 * numberOfCells).toFixed(2));

        // Addebita il costo all'utente.
        await this.creditService.checkAndConsume(userId, cost);

        // Delega al DAO il salvataggio nel database.
        return this.gridModelDAO.create({
            modelId,
            name,
            ownerId: userId,
            rows,
            columns,
            matrix,
            version: 1,
            valid: true
        });
    }
}
