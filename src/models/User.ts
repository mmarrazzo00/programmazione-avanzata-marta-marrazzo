
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../shared/db.js';

/**
 * Modello Sequelize che rappresenta un utente del sistema.
 *
 * Memorizza le informazioni di identificazione,
 * le credenziali di autenticazione, il ruolo
 * e il saldo dei crediti disponibili.
 */
export class User extends Model {
    declare id: number;
    declare username: string;
    declare email: string;
    declare password: string;
    declare role: string;
    declare credit: number;
}

/**
 * Definisce la struttura della tabella user
 * e i vincoli dei relativi attributi.
 */
User.init(
    {
        // Chiave primaria autoincrementale dell'utente.
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        // Nome identificativo dell'utente.
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        // Indirizzo email obbligatorio e univoco.
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },

        // Hash della password utilizzato per l'autenticazione.
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        // Ruolo dell'utente utilizzato per le autorizzazioni.
        // Il valore predefinito è 'user'.
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'user',
        },

        // Saldo dei crediti dell'utente, inizialmente pari a zero.
        credit: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
    },
    {
        // Connessione Sequelize utilizzata per la persistenza.
        sequelize,

        // Nome della tabella nel database PostgreSQL.
        tableName: 'user',

        // Abilita la gestione automatica di createdAt e updatedAt.
        timestamps: true,
    }
);
