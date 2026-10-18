import { Transaction } from 'sequelize';
import { Execution } from '../models/Execution.js';

/**
 * Rappresenta le coordinate di una cella della griglia,
 * identificate da riga e colonna.
 */
interface Coordinates {
    row: number;
    column: number;
}

/**
 * Definisce i dati necessari per registrare
 * un'esecuzione dell'algoritmo di pathfinding.
 */
interface CreateExecutionData {
    gridModelId: number;
    userId: number;
    start: Coordinates;
    goal: Coordinates;
    path: Coordinates[];
    pathCost: number;
    executionTime: number;
}

/**
 * Data Access Object per l'entità Execution.
 *
 * Centralizza le operazioni di persistenza relative
 * alle esecuzioni delle matrici attraverso Sequelize.
 */
export class ExecutionDAO {

    /**
     * Registra nel database una nuova esecuzione della matrice.
     *
     * Memorizza la matrice e l'utente associati, le coordinate
     * iniziali e finali, il percorso calcolato, il relativo
     * costo e il tempo di esecuzione.
     *
     * @param data - Dati dell'esecuzione da registrare.
     * @param transaction - Eventuale transazione Sequelize.
     * @returns L'istanza Execution creata.
     */
    async create(
        data: CreateExecutionData,
        transaction?: Transaction
    ): Promise<Execution> {
        return Execution.create(
            {
                gridModelId: data.gridModelId,
                userId: data.userId,
                start: data.start,
                goal: data.goal,
                path: data.path,
                pathCost: data.pathCost,
                executionTime: data.executionTime
            },
            { transaction }
        );
    }
}
