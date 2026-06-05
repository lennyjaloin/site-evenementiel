// controllers/paymentController.js
import { Payment } from '../models/index.js';

export const createPayment = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { event_id, amount } = req.body;

    const pay = await Payment.create({ user_id, event_id, amount });
    res.status(201).json(pay);
  } catch (err) { next(err); }
};

export const getMyPayments = async (req, res, next) => {
  try {
    const list = await Payment.getByUser(req.user.id);
    res.json(list);
  } catch (err) { next(err); }
};
