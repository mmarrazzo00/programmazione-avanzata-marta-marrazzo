import { GridModel } from '../models/GridModel.js';
import { CreditService } from './CreditService.js';
import { HttpError } from '../middleware/errorHandler.js';

export class GridModelService {
    private creditService = new CreditService();

    async createModel(
        userId: number,
        modelId: string,
        name: string,
        matrix: number[][]
    ): Promise<GridModel> {

        // Verifica che la matrice non sia vuota
        if (matrix.length === 0) {
            throw new HttpError(400, 'Matrix cannot be empty');
        }

        // Numero di colonne della prima riga
        const columns = matrix[0].length;

        if (columns === 0) {
            throw new HttpError(400, 'Matrix cannot have empty rows');
        }

        // Verifica che tutte le righe abbiano lo stesso numero di colonne
        for (const row of matrix) {
            if (row.length !== columns) {
                throw new HttpError(400, 'Matrix must be rectangular');
            }
        }

        // Verifica che ogni cella contenga solamente 0 oppure 1
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

        // Costo della creazione del modello
        const cost = Number((0.025 * numberOfCells).toFixed(2));
        console.log('Creating model with cost:', {userId, cost});

        // Scala il credito dell'utente
        await this.creditService.checkAndConsume(userId, cost);

        // Crea la prima versione del modello
        const model = await GridModel.create({
            modelId,
            name,
            ownerId: userId,
            rows,
            columns,
            matrix,
            version: 1,
            valid: true,
        });

        return model;
    }
}