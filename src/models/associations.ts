import { User } from './User.js';
import { GridModel } from './GridModel.js';
import { UpdateRequest } from './UpdateRequest.js';
import { Update } from './Update.js';
import { Execution } from './Execution.js';

User.hasMany(GridModel, {
    foreignKey: 'ownerId',
    as: 'models',
});

GridModel.belongsTo(User, {
    foreignKey: 'ownerId',
    as: 'owner',
});

User.hasMany(UpdateRequest, {
    foreignKey: 'userId',
    as: 'updateRequests',
});

UpdateRequest.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

GridModel.hasMany(UpdateRequest, {
    foreignKey: 'gridModelId',
    as: 'updateRequests',
});

UpdateRequest.belongsTo(GridModel, {
    foreignKey: 'gridModelId',
    as: 'gridModel',
});

UpdateRequest.hasMany(Update, {
    foreignKey: 'updateRequestId',
    as: 'updates',
});

Update.belongsTo(UpdateRequest, {
    foreignKey: 'updateRequestId',
    as: 'updateRequest',
});

GridModel.hasMany(Execution, {
    foreignKey: 'gridModelId',
    as: 'executions',
});

Execution.belongsTo(GridModel, {
    foreignKey: 'gridModelId',
    as: 'gridModel',
});

User.hasMany(Execution, {
    foreignKey: 'userId',
    as: 'executions',
});

Execution.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});