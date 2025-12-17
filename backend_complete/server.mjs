// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import eventRoutes from './routes/events.js';
import inscriptionRoutes from './routes/inscriptions.js';
import reservationRoutes from './routes/reservations.js';
import paymentRoutes from './routes/payments.js';
import { errorHandler } from './middleware/errorMiddleware.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => res.send('API OK'));

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
