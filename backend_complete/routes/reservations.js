// routes/reservations.js
import express from 'express';
import { createReservation, listReservations, deleteReservation } from '../controllers/reservationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public: réserver sans compte
router.post('/', createReservation);

// Admin: voir/supprimer les réservations
router.get('/', authMiddleware, requireRole('admin'), listReservations);
router.delete('/:id', authMiddleware, requireRole('admin'), deleteReservation);

export default router;
