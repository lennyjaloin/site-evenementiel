// routes/events.js
import express from 'express';
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/eventController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', listEvents);
router.get('/:id', getEvent);
router.post('/', authMiddleware, requireRole('admin'), createEvent);
router.put('/:id', authMiddleware, requireRole('admin'), updateEvent);
router.delete('/:id', authMiddleware, requireRole('admin'), deleteEvent);

export default router;