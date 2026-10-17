
import { GridModelService } from '../src/services/GridModelService.js';
import { GridModelDAO } from '../src/dao/GridModelDAO.js';
import { CreditService } from '../src/services/CreditService.js';
import { GridModel } from '../src/models/GridModel.js';

describe('GridModelService - Creazione modello', () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('Crea un modello valido e addebita il costo corretto', async () => {

        // ARRANGE: preparazione dei dati
        const userId = 1;

        const matrix = [
            [0, 0, 0],
            [1, 1, 0],
            [0, 0, 0]
        ];

        const fakeModel = {
            id: 10,
            modelId: 'test-grid',
            name: 'Griglia di test',
            ownerId: userId,
            rows: 3,
            columns: 3,
            matrix,
            version: 1,
            valid: true
        } as GridModel;

        // Simula il controllo e l'addebito del credito.
        const creditSpy = jest.spyOn(
            CreditService.prototype,
            'checkAndConsume'
        ).mockResolvedValue(undefined);

        // Simula il salvataggio del modello.
        const createSpy = jest.spyOn(
            GridModelDAO.prototype,
            'create'
        ).mockResolvedValue(fakeModel);

        const service = new GridModelService();

        // ACT: esecuzione della funzione da testare
        const result = await service.createModel(
            userId,
            'test-grid',
            'Griglia di test',
            matrix
        );

        // ASSERT: verifica dei risultati
        // 9 celle * 0.025 = 0.225, arrotondato a 0.23
        expect(creditSpy).toHaveBeenCalledWith(
            userId,
            0.23
        );

        expect(createSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                modelId: 'test-grid',
                ownerId: userId,
                rows: 3,
                columns: 3,
                matrix,
                version: 1,
                valid: true
            })
        );

        expect(result).toEqual(fakeModel);
    });

    test('Rifiuta una matrice con valori diversi da 0 e 1', async () => {

        const creditSpy = jest.spyOn(
            CreditService.prototype,
            'checkAndConsume'
        ).mockResolvedValue(undefined);

        const createSpy = jest.spyOn(
            GridModelDAO.prototype,
            'create'
        );

        const service = new GridModelService();

        const invalidMatrix = [
            [0, 1, 0],
            [1, 2, 0],
            [0, 0, 1]
        ];

        await expect(
            service.createModel(
                1,
                'invalid-grid',
                'Griglia non valida',
                invalidMatrix
            )
        ).rejects.toMatchObject({
            status: 400,
            message: 'Matrix values must be 0 or 1'
        });

        // Nessun addebito o salvataggio.
        expect(creditSpy).not.toHaveBeenCalled();
        expect(createSpy).not.toHaveBeenCalled();
    });

    test('Rifiuta una matrice non rettangolare', async () => {

        const service = new GridModelService();

        const invalidMatrix = [
            [0, 1, 0],
            [1, 0]
        ];

        await expect(
            service.createModel(
                1,
                'irregular-grid',
                'Griglia irregolare',
                invalidMatrix
            )
        ).rejects.toMatchObject({
            status: 400,
            message: 'Matrix must be rectangular'
        });
    });
});
