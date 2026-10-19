import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../shared/db.js';

/**
 * Modello Sequelize che rappresenta una versione
 * di una griglia utilizzata per il pathfinding.
 *
 * Contiene l'identificativo logico del modello, il proprietario,
 * le dimensioni, la matrice e le informazioni di versionamento.
 */
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

/**
 * Definisce la struttura della tabella grid_model
 * e i vincoli dei relativi attributi.
 */
GridModel.init(
    {
        // Chiave primaria che identifica un singolo record del modello.
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        // Identificativo logico condiviso dalle versioni dello stesso modello.
        modelId: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        // Nome descrittivo del modello.
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        // Chiave esterna che identifica l'utente proprietario del modello.
        ownerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id',
            },
        },

        // Numero di righe della griglia.
        rows: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        // Numero di colonne della griglia.
        columns: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        // Matrice bidimensionale memorizzata nel formato JSONB.
        matrix: {
            type: DataTypes.JSONB,
            allowNull: false,
        },

        // Numero di versione del modello.
        version: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        // Indica se la versione è valida; il valore predefinito è true.
        valid: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        // Connessione Sequelize al database.
        sequelize,

        // Nome della tabella PostgreSQL.
        tableName: 'grid_model',

        // Abilita la gestione automatica di createdAt e updatedAt.
        timestamps: true,
    }
);
