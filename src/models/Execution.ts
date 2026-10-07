import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../shared/db.js';

export class Execution extends Model {
    declare id: number;
    declare gridModelId: number;
    declare userId: number;
    declare start: object;
    declare goal: object;
    declare path: object;
    declare pathCost: number;
    declare executionTime: number;
}

Execution.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        gridModelId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'grid_model',
                key: 'id',
            },
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id',
            },
        },

        start: {
            type: DataTypes.JSONB,
            allowNull: false,
        },

        goal: {
            type: DataTypes.JSONB,
            allowNull: false,
        },

        path: {
            type: DataTypes.JSONB,
            allowNull: false,
        },

        pathCost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },

        executionTime: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'execution',
        timestamps: true,
    }
);