import { User } from './User.js';
import { GridModel } from './GridModel.js';
import { UpdateRequest } from './UpdateRequest.js';
import { Update } from './Update.js';
import { Execution } from './Execution.js';

/**
 * Definisce le associazioni tra i modelli Sequelize.
 *
 * Le relazioni sono principalmente di tipo uno-a-molti (1:N)
 * e permettono di navigare tra le entità attraverso
 * le chiavi esterne.
 */

// Un utente può possedere più modelli a griglia.
// Ogni modello appartiene a un solo proprietario.
User.hasMany(GridModel, {
    foreignKey: 'ownerId',
    as: 'models',
});

GridModel.belongsTo(User, {
    foreignKey: 'ownerId',
    as: 'owner',
});

// Un utente può proporre più richieste di aggiornamento.
// Ogni richiesta è associata all'utente proponente.
User.hasMany(UpdateRequest, {
    foreignKey: 'userId',
    as: 'updateRequests',
});

UpdateRequest.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

// Una versione di GridModel può avere più richieste di aggiornamento.
// Ogni richiesta si riferisce a una specifica versione del modello.
GridModel.hasMany(UpdateRequest, {
    foreignKey: 'gridModelId',
    as: 'updateRequests',
});

UpdateRequest.belongsTo(GridModel, {
    foreignKey: 'gridModelId',
    as: 'gridModel',
});

// Una richiesta di aggiornamento può comprendere più modifiche.
// Ogni modifica riguarda una cella ed è associata a una richiesta.
UpdateRequest.hasMany(Update, {
    foreignKey: 'updateRequestId',
    as: 'updates',
});

Update.belongsTo(UpdateRequest, {
    foreignKey: 'updateRequestId',
    as: 'updateRequest',
});

// Una versione del modello può essere eseguita più volte.
// Ogni esecuzione è associata alla versione utilizzata.
GridModel.hasMany(Execution, {
    foreignKey: 'gridModelId',
    as: 'executions',
});

Execution.belongsTo(GridModel, {
    foreignKey: 'gridModelId',
    as: 'gridModel',
});

// Un utente può effettuare più esecuzioni.
// Ogni esecuzione è associata all'utente che l'ha avviata.
User.hasMany(Execution, {
    foreignKey: 'userId',
    as: 'executions',
});

Execution.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});
