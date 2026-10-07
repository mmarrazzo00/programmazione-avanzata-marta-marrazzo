import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbHost = process.env.DB_HOST;
const dbPort = Number(process.env.DB_PORT);

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