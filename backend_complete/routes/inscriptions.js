// routes/inscriptions.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/inscriptionController.js';

const router = express.Router();
router.post('/', authMiddleware, ctrl.createInscription);
router.get('/me', authMiddleware, ctrl.getUserInscriptions);
router.delete('/:id', authMiddleware, ctrl.cancelInscription);

export default router;
