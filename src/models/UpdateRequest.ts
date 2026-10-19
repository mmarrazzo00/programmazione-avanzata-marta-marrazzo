import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../shared/db.js';

/**
 * Modello Sequelize che rappresenta una richiesta
 * di aggiornamento di una griglia.
 *
 * Memorizza l'utente proponente, la versione del modello,
 * il costo delle modifiche, lo stato della richiesta
 * e le informazioni relative alla decisione.
 *
 * Supporta inoltre il collegamento a una richiesta padre,
 * necessario per gestire richieste derivate.
 */
export class UpdateRequest extends Model {
    declare id: number;
    declare userId: number;
    declare gridModelId: number;
    declare parentRequestId: number | null;
    declare cost: number;
    declare status: string;
    declare decidedAt: Date | null;
}

/**
 * Definisce la struttura della tabella update_request
 * e i vincoli dei relativi attributi.
 */
UpdateRequest.init(
    {
        // Chiave primaria autoincrementale della richiesta.
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        // Chiave esterna che identifica l'utente proponente.
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id',
            },
        },

        // Chiave esterna riferita alla versione del modello da aggiornare.
        gridModelId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'grid_model',
                key: 'id',
            },
        },

        // Riferimento opzionale a una richiesta di aggiornamento padre.
        // Consente di collegare le richieste generate da una suddivisione.
        parentRequestId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'update_request',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },

        // Costo associato alla richiesta, con due cifre decimali.
        cost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },

        // Stato della richiesta; inizialmente è pending.
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'pending',
        },

        // Data della decisione, assente finché non viene registrata.
        decidedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        // Connessione Sequelize utilizzata per la persistenza.
        sequelize,

        // Nome della tabella nel database PostgreSQL.
        tableName: 'update_request',

        // Abilita la gestione automatica di createdAt e updatedAt.
        timestamps: true,
    }
);

