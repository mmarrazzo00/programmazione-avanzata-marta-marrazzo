import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../shared/db.js';

export class GridModel extends Model {
    declare id: number;
    declare modelId: string;
    declare name: string;
    declare ownerId: number;
    declare rows: number;
    declare columns: number;
    declare matrix: number[][];
    declare version: number;
    declare valid: boolean;
}

GridModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        modelId: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },

         ownerId: {
             type: DataTypes.INTEGER,
             allowNull: false,
             references: {
                  model: 'user',
                  key: 'id',
             },
},

        rows: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        columns: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        matrix: {
            type: DataTypes.JSONB,
            allowNull: false,
        },

        version: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        valid: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'grid_model',
        timestamps: true,
    }
);