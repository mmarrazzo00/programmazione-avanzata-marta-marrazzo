import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../shared/db.js';

/**
 * Modello Sequelize che rappresenta una modifica
 * a una singola cella di una griglia.
 *
 * Ogni modifica appartiene a una richiesta di aggiornamento
 * e contiene le coordinate della cella, il valore precedente
 * e il nuovo valore proposto.
 */
export class Update extends Model {
    declare id: number;
    declare updateRequestId: number;
    declare row: number;
    declare column: number;
    declare oldValue: number;
    declare newValue: number;
}

/**
 * Definisce la struttura della tabella update
 * e i vincoli dei relativi attributi.
 */
Update.init(
    {
        // Chiave primaria autoincrementale della modifica.
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        // Chiave esterna che collega la modifica alla richiesta di aggiornamento.
        updateRequestId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'update_request',
                key: 'id',
            },
        },

        // Indice della riga della cella da modificare.
        row: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        // Indice della colonna della cella da modificare.
        column: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        // Valore della cella prima della modifica proposta.
        oldValue: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        // Nuovo valore proposto per la cella.
        newValue: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        // Connessione Sequelize utilizzata per la persistenza.
        sequelize,

        // Nome della tabella nel database PostgreSQL.
        tableName: 'update',

        // Abilita la gestione automatica di createdAt e updatedAt.
        timestamps: true,
    }
);
