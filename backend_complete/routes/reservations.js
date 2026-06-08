// routes/reservations.js
import express from 'express';
import { createReservation, listReservations, cancelReservation, restoreReservation, deleteReservation } from '../controllers/reservationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createReservationSchema } from '../validators/index.js';
import { reservationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/', reservationLimiter, validate(createReservationSchema), createReservation);
router.get('/', authMiddleware, listReservations);
router.patch('/:id/cancel', authMiddleware, cancelReservation);
router.patch('/:id/restore', authMiddleware, restoreReservation);
router.delete('/:id', authMiddleware, requireRole('admin'), deleteReservation);

export default router;