
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { Transaction } from 'sequelize';

import { sequelize } from '../shared/db.js';
import { User } from '../models/User.js';
import { GridModel } from '../models/GridModel.js';
import { UpdateRequest } from '../models/UpdateRequest.js';
import { Update } from '../models/Update.js';

dotenv.config();

// Configurazione dei tre modelli dimostrativi.
interface DemoGrid {
    id: string;
    name: string;
    size: number;
}

// Tutte le date sono espresse in UTC.
const dates = {
    created: '2026-07-01T10:00:00Z',
    accepted: '2026-07-10T10:00:00Z',
    acceptedDecision: '2026-07-11T10:00:00Z',
    rejected: '2026-08-05T10:00:00Z',
    rejectedDecision: '2026-08-07T10:00:00Z',
    pendingSeptember: '2026-09-14T10:00:00Z',
    pendingOctober: '2026-10-10T10:00:00Z'
};

const grids: DemoGrid[] = [
    { id: 'demo-simple', name: 'Griglia semplice', size: 5 },
    { id: 'demo-medium', name: 'Griglia intermedia', size: 8 },
    { id: 'demo-complex', name: 'Griglia complessa', size: 10 }
];

// Crea una griglia quadrata con alcuni ostacoli.
// 0 = percorribile, 1 = ostacolo.
function generateMatrix(size: number): number[][] {
    return Array.from({ length: size }, (_, row) =>
        Array.from({ length: size }, (_, column) => {
            if (row === 0 || column === size - 1) {
                return 0;
            }
            return row % 2 === 1 &&
                   column > 0 &&
                   column < size - 2
                ? 1
                : 0;
        })
    );
}

// Imposta date storiche riproducibili.
// Usiamo SQL parametrizzato perché le date automatiche
// createdAt e updatedAt sono gestite da Sequelize.
async function setHistoricalDates(
    table: 'grid_model' | 'update_request' | 'update',
    id: number,
    createdAt: string,
    updatedAt: string,
    transaction: Transaction
): Promise<void> {
    await sequelize.query(
        `UPDATE "${table}"
         SET "createdAt" = :createdAt,
             "updatedAt" = :updatedAt
         WHERE id = :id`,
        {
            replacements: { id, createdAt, updatedAt },
            transaction
        }
    );
}

// Crea gli utenti senza sovrascrivere quelli esistenti.
async function seedUsers(): Promise<{
    admin: User;
    user: User;
}> {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    const [admin] = await User.findOrCreate({
        where: { email: 'admin@example.com' },
        defaults: {
            username: 'Admin',
            email: 'admin@example.com',
            password: adminPassword,
            role: 'admin',
            credit: 1000
        }
    });

    const [user] = await User.findOrCreate({
        where: { email: 'user@example.com' },
        defaults: {
            username: 'User',
            email: 'user@example.com',
            password: userPassword,
            role: 'user',
            credit: 100
        }
    });

    return { admin, user };
}

// Registra una richiesta con una modifica di cella.
// Non applica automaticamente la modifica alla matrice.
async function createRequest(
    grid: GridModel,
    userId: number,
    row: number,
    column: number,
    status: 'accepted' | 'rejected' | 'pending',
    createdAt: string,
    decidedAt: string | null,
    transaction: Transaction
): Promise<void> {
    const oldValue = grid.matrix[row][column];
    const newValue = oldValue === 0 ? 1 : 0;

    const request = await UpdateRequest.create({
        userId,
        gridModelId: grid.id,
        parentRequestId: null,
        cost: 0.35,
        status,
        decidedAt: decidedAt ? new Date(decidedAt) : null
    }, { transaction });

    await setHistoricalDates(
        'update_request',
        request.id,
        createdAt,
        decidedAt ?? createdAt,
        transaction
    );

    const update = await Update.create({
        updateRequestId: request.id,
        row,
        column,
        oldValue,
        newValue
    }, { transaction });

    await setHistoricalDates(
        'update',
        update.id,
        createdAt,
        createdAt,
        transaction
    );
}

// Crea un modello completo con due versioni,
// una richiesta accettata, una rigettata e due pending.
async function seedModel(
    demo: DemoGrid,
    adminId: number,
    userId: number
): Promise<void> {
    await sequelize.transaction(async transaction => {

        // Blocca il proprietario per aggiornare il credito.
        const owner = await User.findByPk(adminId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!owner) {
            throw new Error('Admin not found');
        }

        // Controlla se il modello è già presente.
        const existing = await GridModel.findOne({
            where: { modelId: demo.id },
            transaction
        });

        if (existing) {
            console.log(`Skipped ${demo.id}: already exists`);
            return;
        }

        const matrix = generateMatrix(demo.size);
        const creationCost = Number(
            (demo.size * demo.size * 0.025).toFixed(2)
        );

        if (Number(owner.credit) < creationCost) {
            throw new Error('Insufficient admin credit');
        }

        owner.credit = Number(
            (Number(owner.credit) - creationCost).toFixed(2)
        );
        await owner.save({ transaction });

        // Versione 1, successivamente superata.
        const version1 = await GridModel.create({
            modelId: demo.id,
            name: demo.name,
            ownerId: adminId,
            rows: demo.size,
            columns: demo.size,
            matrix,
            version: 1,
            valid: false
        }, { transaction });

        await setHistoricalDates(
            'grid_model',
            version1.id,
            dates.created,
            dates.acceptedDecision,
            transaction
        );

        // Aggiornamento del 10 luglio: accettato.
        // La cella (0,1) passa da 0 a 1.
        await createRequest(
            version1, userId, 0, 1,
            'accepted',
            dates.accepted,
            dates.acceptedDecision,
            transaction
        );

        // L'utente paga per la richiesta accettata,
        // come previsto dal service attuale.
        const contributor = await User.findByPk(userId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!contributor ||
            Number(contributor.credit) < 0.35) {
            throw new Error('Insufficient contributor credit');
        }

        contributor.credit = Number(
            (Number(contributor.credit) - 0.35).toFixed(2)
        );
        await contributor.save({ transaction });

        // Versione 2 prodotta dall'approvazione.
        const updatedMatrix = matrix.map(row => [...row]);
        updatedMatrix[0][1] = 1;

        const version2 = await GridModel.create({
            modelId: demo.id,
            name: demo.name,
            ownerId: adminId,
            rows: demo.size,
            columns: demo.size,
            matrix: updatedMatrix,
            version: 2,
            valid: true
        }, { transaction });

        await setHistoricalDates(
            'grid_model',
            version2.id,
            dates.acceptedDecision,
            dates.acceptedDecision,
            transaction
        );

        // Richiesta rigettata in agosto.
        // Non modifica la griglia.
        await createRequest(
            version2, userId, 1, 0,
            'rejected',
            dates.rejected,
            dates.rejectedDecision,
            transaction
        );

        // Richiesta pending di settembre.
        await createRequest(
            version2, userId, 0, 2,
            'pending',
            dates.pendingSeptember,
            null,
            transaction
        );

        // Seconda richiesta pending di ottobre.
        await createRequest(
            version2, userId, 0, 3,
            'pending',
            dates.pendingOctober,
            null,
            transaction
        );

        console.log(
            `Created ${demo.id}: 2 versions, 4 requests`
        );
    });
}

/**
 * Prepara uno scenario dimostrativo per verificare
 * il comportamento delle approvazioni quando l'utente
 * che ha richiesto la modifica non ha credito.
 *
 * Lo scenario viene creato soltanto se non esiste gia'.
 * In questo modo una seconda esecuzione del seed
 * non annulla una ricarica effettuata dall'admin.
 */
async function seedNoCreditScenario(): Promise<void> {
    await sequelize.transaction(async transaction => {

        const email = 'nocredit@example.com';

        // Crea un utente con credito iniziale zero.
        const passwordHash = await bcrypt.hash(
            'nocredit123',
            10
        );

        const [noCreditUser] = await User.findOrCreate({
            where: { email },
            defaults: {
                username: 'UserNoCredit',
                email,
                password: passwordHash,
                role: 'user',
                credit: 0
            },
            transaction
        });

        // Recupera la versione attualmente valida
        // del modello demo-simple.
        const model = await GridModel.findOne({
            where: {
                modelId: 'demo-simple',
                valid: true
            },
            transaction
        });

        if (!model) {
            throw new Error(
                'Active demo-simple model not found'
            );
        }

        // Evita di creare richieste duplicate.
        const existingRequest = await UpdateRequest.findOne({
            where: {
                userId: noCreditUser.id,
                gridModelId: model.id
            },
            transaction
        });

        if (existingRequest) {
            console.log(
                'No-credit scenario already exists'
            );
            return;
        }

        // Scegliamo una cella valida e percorribile.
        const row = 0;
        const column = 4;

        const oldValue = model.matrix[row][column];
        const newValue = oldValue === 0 ? 1 : 0;

        const requestDate = '2026-09-20T10:00:00Z';

        // La richiesta e' pending:
        // non viene applicata alcuna modifica.
        const request = await UpdateRequest.create({
            userId: noCreditUser.id,
            gridModelId: model.id,
            parentRequestId: null,
            cost: 0.35,
            status: 'pending',
            decidedAt: null
        }, { transaction });

        // Imposta una data storica per testare i filtri.
        await setHistoricalDates(
            'update_request',
            request.id,
            requestDate,
            requestDate,
            transaction
        );

        // Registra la modifica che il proprietario
        // potra' approvare oppure rigettare.
        const update = await Update.create({
            updateRequestId: request.id,
            row,
            column,
            oldValue,
            newValue
        }, { transaction });

        await setHistoricalDates(
            'update',
            update.id,
            requestDate,
            requestDate,
            transaction
        );

        console.log(
            `No-credit user created: ${email}`
        );
        console.log(
            `Pending request ID: ${request.id}`
        );
        console.log(
            `Current credit: ${noCreditUser.credit}`
        );
    });
}


/**
 * Inizializza due modelli dedicati ai test
 * dell'algoritmo A* tramite Postman.
 *
 * astar-demo:
 *   griglia con percorso ottimo disponibile.
 *
 * astar-blocked:
 *   griglia nella quale non esiste un percorso
 *   tra il punto di partenza e la destinazione.
 *
 * La funzione evita di creare duplicati
 * se il seed viene eseguito più volte.
 */
async function seedAStarModels(): Promise<void> {

    const user = await User.findOne({
        where: { email: 'user@example.com' }
    });

    if (!user) {
        throw new Error('Demo user not found');
    }

    const models = [
        {
            modelId: 'astar-demo',
            name: 'Demo A* - Percorso disponibile',
            matrix: [
                [0, 0, 0],
                [1, 1, 0],
                [0, 0, 0]
            ]
        },
        {
            modelId: 'astar-blocked',
            name: 'Demo A* - Nessun percorso',
            matrix: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 1, 0]
            ]
        }
    ];

    for (const model of models) {

        await sequelize.transaction(async transaction => {

            const existing = await GridModel.findOne({
                where: { modelId: model.modelId },
                transaction
            });

            if (existing) {
                console.log(
                    `Skipped ${model.modelId}: already exists`
                );
                return;
            }

            await GridModel.create({
                modelId: model.modelId,
                name: model.name,
                ownerId: user.id,
                rows: model.matrix.length,
                columns: model.matrix[0].length,
                matrix: model.matrix,
                version: 1,
                valid: true
            }, { transaction });

            console.log(
                `Created A* model: ${model.modelId}`
            );
        });
    }
}


/**
 * Funzione principale di inizializzazione.
 *
 * Ordine:
 * 1. Connessione al database.
 * 2. Creazione degli utenti.
 * 3. Creazione dei tre modelli con versioni e storico.
 * 4. Preparazione dello scenario credito insufficiente.
 * 5. Creazione dei modelli per i test A*.
 */
async function main(): Promise<void> {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        const { admin, user } = await seedUsers();
        console.log('Users initialized');

        // Modelli con due versioni e richieste storiche.
        for (const demo of grids) {
            await seedModel(demo, admin.id, user.id);
        }

        // Utente con credito zero e richiesta pending.
        await seedNoCreditScenario();

        // Modelli dedicati alle esecuzioni A*.
        await seedAStarModels();

        console.log('Seed completed');

    } finally {
        await sequelize.close();
    }
}

// Il seed deve essere eseguito una sola volta.
main().catch(error => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
});

