import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../shared/db.js';

/**
 * Modello Sequelize che rappresenta un'esecuzione
 * dell'algoritmo di pathfinding su una griglia.
 *
 * Memorizza il modello eseguito, l'utente, le coordinate
 * di partenza e destinazione, il percorso calcolato
 * e le relative informazioni di costo e tempo.
 */
export class Execution extends Model {
    declare id: number;
    declare gridModelId: number;
    declare userId: number;
    declare start: { row: number; column: number };
    declare goal: { row: number; column: number };
    declare path: { row: number; column: number }[];
    declare pathCost: number;
    declare executionTime: number;
}

// Definisce la struttura della tabella associata al modello Execution.
Execution.init(
    {
        // Chiave primaria autoincrementale dell'esecuzione.
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        // Riferimento alla versione del modello a griglia eseguito.
        gridModelId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'grid_model',
                key: 'id',
            },
        },

        // Riferimento all'utente che ha effettuato l'esecuzione.
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id',
            },
        },

        // Coordinate della cella di partenza, memorizzate in JSONB.
        start: {
            type: DataTypes.JSONB,
            allowNull: false,
        },

        // Coordinate della cella di destinazione, memorizzate in JSONB.
        goal: {
            type: DataTypes.JSONB,
            allowNull: false,
        },

        // Sequenza delle celle che compongono il percorso calcolato.
        path: {
            type: DataTypes.JSONB,
            allowNull: false,
        },

        // Costo del percorso, rappresentato con due cifre decimali.
        pathCost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },

        // Tempo di esecuzione dell'algoritmo, espresso come valore intero.
        executionTime: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        // Connessione Sequelize utilizzata per la persistenza.
        sequelize,

        // Nome della tabella nel database PostgreSQL.
        tableName: 'execution',

        // Abilita la gestione automatica di createdAt e updatedAt.
        timestamps: true,
    }
);
