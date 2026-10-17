
import { ModelExecutionService } from '../src/services/ModelExecutionService.js';
import { GridModelDAO } from '../src/dao/GridModelDAO.js';
import { ExecutionDAO } from '../src/dao/ExecutionDAO.js';
import { CreditService } from '../src/services/CreditService.js';
import { GridModel } from '../src/models/GridModel.js';
import { sequelize } from '../src/shared/db.js';

describe('ModelExecutionService - Algoritmo A*', () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('Trova il percorso ottimo evitando gli ostacoli', async () => {

        // ARRANGE: griglia di prova
        const matrix = [
            [0, 0, 0],
            [1, 1, 0],
            [0, 0, 0]
        ];

        const fakeModel = {
            id: 10,
            modelId: 'astar-test',
            rows: 3,
            columns: 3,
            matrix,
            version: 1,
            valid: true
        } as GridModel;

        const fakeTransaction = {
            commit: jest.fn().mockResolvedValue(undefined),
            rollback: jest.fn().mockResolvedValue(undefined)
        };

        // Simula l'avvio di una transazione Sequelize.
        jest.spyOn(sequelize, 'transaction')
            .mockResolvedValue(fakeTransaction as never);

        // Simula il recupero della griglia dal database.
        jest.spyOn(
            GridModelDAO.prototype,
            'findValidByModelId'
        ).mockResolvedValue(fakeModel);

        // Simula l'addebito senza modificare il database.
        const creditSpy = jest.spyOn(
            CreditService.prototype,
            'checkAndConsume'
        ).mockResolvedValue(undefined);

        // Simula la registrazione dell'esecuzione.
        const executionSpy = jest.spyOn(
            ExecutionDAO.prototype,
            'create'
        ).mockImplementation(async data => data as never);

        const service = new ModelExecutionService();

        const start = { row: 0, column: 0 };
        const goal = { row: 2, column: 2 };

        // ACT: il service esegue realmente A*
        const result = await service.executeModel(
            1,
            'astar-test',
            start,
            goal
        );

        // ASSERT: risultato della ricerca
        const expectedPath = [
            { row: 0, column: 0 },
            { row: 0, column: 1 },
            { row: 0, column: 2 },
            { row: 1, column: 2 },
            { row: 2, column: 2 }
        ];

        expect(result.path).toEqual(expectedPath);

        // Quattro movimenti, senza diagonali.
        expect(result.pathCost).toBe(4);

        // Nessuna cella attraversata deve essere un ostacolo.
        for (const point of result.path) {
            expect(matrix[point.row][point.column]).toBe(0);
        }

        // Tempo di esecuzione espresso in millisecondi.
        expect(Number.isInteger(result.executionTime)).toBe(true);
        expect(result.executionTime).toBeGreaterThanOrEqual(0);

        // Costo in token: 9 * 0.025 = 0.23.
        expect(creditSpy).toHaveBeenCalledWith(
            1,
            0.23,
            fakeTransaction
        );

        // Il risultato deve essere salvato.
        expect(executionSpy).toHaveBeenCalledTimes(1);

        // La transazione deve essere completata.
        expect(fakeTransaction.commit).toHaveBeenCalledTimes(1);
        expect(fakeTransaction.rollback).not.toHaveBeenCalled();
    });

    test('Rifiuta coordinate al di fuori della griglia', async () => {

        const fakeModel = {
            id: 10,
            modelId: 'astar-test',
            rows: 2,
            columns: 2,
            matrix: [
                [0, 0],
                [0, 0]
            ]
        } as GridModel;

        const fakeTransaction = {
            commit: jest.fn().mockResolvedValue(undefined),
            rollback: jest.fn().mockResolvedValue(undefined)
        };

        jest.spyOn(sequelize, 'transaction')
            .mockResolvedValue(fakeTransaction as never);

        jest.spyOn(
            GridModelDAO.prototype,
            'findValidByModelId'
        ).mockResolvedValue(fakeModel);

        const creditSpy = jest.spyOn(
            CreditService.prototype,
            'checkAndConsume'
        );

        const service = new ModelExecutionService();

        await expect(
            service.executeModel(
                1,
                'astar-test',
                { row: 0, column: 0 },
                { row: 5, column: 5 }
            )
        ).rejects.toMatchObject({
            status: 400,
            message: 'Start or goal is outside the grid'
        });

        expect(fakeTransaction.rollback).toHaveBeenCalledTimes(1);
        expect(fakeTransaction.commit).not.toHaveBeenCalled();
        expect(creditSpy).not.toHaveBeenCalled();
    });
});
