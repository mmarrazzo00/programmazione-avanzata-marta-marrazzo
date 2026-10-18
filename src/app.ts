import express from 'express';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import gridModelRoutes from './routes/gridModelRoutes.js';
import modelExecutionRoutes from './routes/modelExecutionRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import updateRequestAnalysisRoutes from './routes/updateRequestAnalysisRoutes.js';
import updateRequestRoutes from './routes/updateRequestRoutes.js';

// Crea un'istanza dell'app Express
const app = express();

// Abilita il parsing del corpo delle richieste in formato JSON
app.use(express.json());

// Endpoint di controllo per verificare che il backend sia operativo.
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// Registra le rotte dell'applicazione
app.use(userRoutes);
app.use(authRoutes);
app.use(gridModelRoutes);
app.use(updateRequestRoutes);
app.use(updateRequestAnalysisRoutes);
app.use(modelExecutionRoutes);

// Middleware per gestire le richieste a risorse non trovate
app.use(notFound);

// Middleware per gestire gli errori generali dell'applicazione
app.use(errorHandler);

export default app;