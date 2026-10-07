import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../shared/db.js';

export class Update extends Model {
    declare id: number;
    declare updateRequestId: number;
    declare row: number;
    declare column: number;
    declare oldValue: number;
    declare newValue: number;
}

Update.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        updateRequestId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'update_request',
                key: 'id',
            },
        },

        row: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        column: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        oldValue: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        newValue: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'update',
        timestamps: true,
    }
);