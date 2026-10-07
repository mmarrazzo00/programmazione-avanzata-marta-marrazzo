import dotenv from 'dotenv';

dotenv.config();

import app from './app.js';
import { sequelize } from './shared/db.js';
import { User } from './models/User.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function start() {
    try {
        await sequelize.authenticate();

        console.log('Database connected successfully');

        await User.sync();

        console.log('Database synchronized successfully');


        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

void start();
