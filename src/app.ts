import express from 'express';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.use(userRoutes);
app.use(authRoutes);

// Middleware 404
app.use(notFound);

// Middleware globale degli errori
app.use(errorHandler);

export default app;