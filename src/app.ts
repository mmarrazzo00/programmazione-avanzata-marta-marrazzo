import express from 'express';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import gridModelRoutes from './routes/gridModelRoutes.js';
import updateRequestRoutes from './routes/updateRequestRoutes.js';
import modelExecutionRoutes from './routes/modelExecutionRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.use(userRoutes);
app.use(authRoutes);
app.use(gridModelRoutes);
app.use(updateRequestRoutes);
app.use(modelExecutionRoutes);

// Middleware 404
app.use(notFound);

// Middleware globale degli errori
app.use(errorHandler);

export default app;