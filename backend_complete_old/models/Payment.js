// models/Payment.js
import { db } from '../db.js';
import { payments } from '../schema.js';
import { eq } from 'drizzle-orm';

const Payment = {
  async create({ user_id, event_id, amount }) {
    await db.insert(payments).values({ user_id, event_id, amount, status: 'paid' });
    const [pay] = await db.select().from(payments).orderBy(payments.id.desc()).limit(1);
    return pay;
  },

  async getByUser(user_id) {
    return db.select().from(payments).where(eq(payments.user_id, user_id));
  }
};

export default Payment;
