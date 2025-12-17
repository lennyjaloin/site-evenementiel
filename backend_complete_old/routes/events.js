// routes/events.js
import express from 'express';
import * as ctrl from '../controllers/eventController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', ctrl.listEvents);
router.get('/:id', ctrl.getEvent);
router.post('/', authMiddleware, requireRole('organizer','admin'), ctrl.createEvent);
router.put('/:id', authMiddleware, requireRole('organizer','admin'), ctrl.updateEvent);
router.delete('/:id', authMiddleware, requireRole('organizer','admin'), ctrl.deleteEvent);

export default router;
