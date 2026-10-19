import { performance } from 'node:perf_hooks';
import { AStarFinder } from 'astar-typescript';
import { GridModel } from '../models/GridModel.js';
import { CreditService } from './CreditService.js';
import { HttpError } from '../middleware/errorHandler.js';
import { sequelize } from '../shared/db.js';
import { GridModelDAO } from '../dao/GridModelDAO.js';
import { ExecutionDAO } from '../dao/ExecutionDAO.js';

/**
 * Rappresenta le coordinate di una cella della griglia.
 * row indica la riga, column indica la colonna.
 */
export interface Coordinates {
    row: number;
    column: number;
}

/**
 * Service responsabile dell'esecuzione del pathfinding.
 *
 * Recupera la versione valida del modello, verifica le coordinate,
 * esegue l'algoritmo A*, calcola il costo dell'esecuzione
 * e registra il risultato nel database.
 *
 * Utilizza una transazione Sequelize per coordinare
 * l'addebito dei crediti e il salvataggio dell'esecuzione.
 */
export class ModelExecutionService {
    private creditService = new CreditService();
    private gridModelDAO = new GridModelDAO();
    private executionDAO = new ExecutionDAO();

    /**
     * Esegue l'algoritmo A* su un modello a griglia.
     *
     * Il percorso viene calcolato tra due celle percorribili,
     * senza consentire movimenti diagonali.
     *
     * @param userId - Identificativo dell'utente che esegue il modello.
     * @param modelId - Identificativo logico del modello.
     * @param start - Coordinate della cella iniziale.
     * @param goal - Coordinate della cella di destinazione.
     * @returns Il record dell'esecuzione salvato nel database.
     */
    async executeModel(
        userId: number,
        modelId: string,
        start: Coordinates,
        goal: Coordinates
    ) {
        // Avvia una transazione per coordinare le operazioni sul database.
        const transaction = await sequelize.transaction();

        try {
            // Recupera la versione valida del modello richiesto.
            const model = await this.gridModelDAO.findValidByModelId(
                modelId,
                transaction
            );

            if (!model) { throw new HttpError(404, 'Model not found'); }

            // Verifica che entrambe le coordinate siano interne alla griglia.
            this.validateCoordinates(start, model);
            this.validateCoordinates(goal, model);

            // Controlla che la cella iniziale sia percorribile.
            if (model.matrix[start.row][start.column] !== 0) {
                throw new HttpError(
                    400, 'Start must be walkable cells');
            }

            // Controlla che la cella di destinazione sia percorribile.
            if (model.matrix[goal.row][goal.column] !== 0) {
                throw new HttpError(400, 'Goal must be walkable cells'
                );
            }

            // Calcola il costo dell'esecuzione in base alle dimensioni della griglia.
            const executionCost = Number(
                (model.rows * model.columns * 0.025).toFixed(2)
            );

            // Configura A* sulla matrice, escludendo gli spostamenti diagonali.
            const finder = new AStarFinder({
                grid: {
                    matrix: model.matrix
                },
                diagonalAllowed: false
            });

            // Avvia la misurazione del tempo impiegato dall'algoritmo.
            const startTime = performance.now();

            // Calcola il percorso usando il formato x/y richiesto dalla libreria.
            const rawPath = finder.findPath(
                { x: start.column, y: start.row },
                { x: goal.column, y: goal.row }
            );

            // Calcola il tempo trascorso, arrotondato in millisecondi.
            const executionTime = Math.round(
                performance.now() - startTime
            );

            // Converte il percorso dal formato [x, y] a { row, column }.
            const path = rawPath.map(point => ({
                row: point[1],
                column: point[0]
            }));

            // Segnala l'assenza di un percorso tra le due celle.
            if (path.length === 0) {
                throw new HttpError(404, 'No path found');
            }

            // Con celle non pesate, ogni movimento costa 1.
            const pathCost = path.length - 1;

            // Addebita i crediti necessari all'esecuzione.
            await this.creditService.checkAndConsume(
                userId,
                executionCost,
                transaction
            );

            // Registra il percorso e le informazioni dell'esecuzione.
            const execution = await this.executionDAO.create(
                {
                    gridModelId: model.id,
                    userId,
                    start,
                    goal,
                    path,
                    pathCost,
                    executionTime
                },
                transaction);

            // Conferma l'addebito e il salvataggio dell'esecuzione.
            await transaction.commit();

            return execution;
        } catch (error) {
            // Annulla le operazioni della transazione in caso di errore.
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Verifica che una coordinata sia composta da interi
     * non negativi e appartenga ai limiti della griglia.
     *
     * @throws HttpError 400 se la coordinata non è valida.
     */
    private validateCoordinates(
        point: Coordinates,
        model: GridModel
    ): void {
        if (
            !Number.isInteger(point.row) ||
            !Number.isInteger(point.column) ||
            point.row < 0 ||
            point.column < 0 ||
            point.row >= model.rows ||
            point.column >= model.columns
        ) {
            throw new HttpError(
                400,
                'Start or goal is outside the grid'
            );
        }
    }
}
