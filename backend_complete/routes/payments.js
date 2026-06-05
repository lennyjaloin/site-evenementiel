// routes/payments.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/paymentController.js';
const router = express.Router();
router.post('/', authMiddleware, ctrl.createPayment);
router.get('/me', authMiddleware, ctrl.getMyPayments);
export default router;
