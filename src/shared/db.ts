import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Carica le variabili d'ambiente dal file .env.
dotenv.config();

// Recupera i parametri necessari alla connessione al database.
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbHost = process.env.DB_HOST;
const dbPort = Number(process.env.DB_PORT);

// Verifica che tutte le variabili d'ambiente obbligatorie siano definite.
if (!dbName) {
    throw new Error('DB_NAME is not defined');
}

if (!dbUser) {
    throw new Error('DB_USER is not defined');
}

if (!dbPass) {
    throw new Error('DB_PASS is not defined');
}

if (!dbHost) {
    throw new Error('DB_HOST is not defined');
}

if (!dbPort) {
    throw new Error('DB_PORT is not defined');
}

/**
 * Istanza Sequelize utilizzata per la connessione a PostgreSQL.
 *
 * Configura il database tramite le variabili d'ambiente
 * e disabilita la visualizzazione delle query SQL nel terminale.
 *
 * L'istanza viene condivisa dai modelli e dai Service
 * che utilizzano le transazioni.
 */
export const sequelize = new Sequelize(
    dbName,
    dbUser,
    dbPass,
    {
        host: dbHost,
        port: dbPort,
        dialect: 'postgres',
        logging: false,
    }
);
