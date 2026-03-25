// routes/users.js
import express from 'express';
import { getUsers, getUser, deleteUser } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, requireRole('admin'), getUsers);
router.get('/:id', authMiddleware, requireRole('admin'), getUser);
router.delete('/:id', authMiddleware, requireRole('admin'), deleteUser);

export default router;
