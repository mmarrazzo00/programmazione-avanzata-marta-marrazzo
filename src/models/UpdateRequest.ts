import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../shared/db.js';

export class UpdateRequest extends Model {
    declare id: number;
    declare userId: number;
    declare gridModelId: number;
    declare cost: number;
    declare status: string;
    declare decidedAt: Date | null;
}

UpdateRequest.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id',
            },
        },

        gridModelId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'grid_model',
                key: 'id',
            },
        },

        cost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },

        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'pending',
        },

        decidedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'update_request',
        timestamps: true,
    }
);