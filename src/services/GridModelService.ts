
import { GridModel } from '../models/GridModel.js';
import { CreditService } from './CreditService.js';
import { GridModelDAO } from '../dao/GridModelDAO.js';
import { HttpError } from '../middleware/errorHandler.js';

export class GridModelService {

    private creditService = new CreditService();
    private gridModelDAO = new GridModelDAO();

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