import dotenv from 'dotenv';

//carica le variabili d'ambiente dal file .env
dotenv.config();

import app from './app.js';
import { sequelize } from './shared/db.js';
import { User } from './models/User.js';
import { GridModel } from './models/GridModel.js';
import { UpdateRequest } from './models/UpdateRequest.js';
import { Update } from './models/Update.js';
import { Execution} from './models/Execution.js';
import './models/associations.js';


const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function start() {
    try {
       // Verifica che la connessione al database sia disponibile.
        await sequelize.authenticate();

        console.log('Database connected successfully');

        // Sincronizza i modelli con il database.
        await User.sync();
        await GridModel.sync();
        await UpdateRequest.sync();
        await Update.sync();
        await Execution.sync();
        
        console.log('Database synchronized successfully');


        // Avvia il server Express.
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (error) {
        // Segnala errori di connessione al database.
        console.error('Unable to connect to the database:', error);
    }
}

// Avvia l'applicazione.
void start();
