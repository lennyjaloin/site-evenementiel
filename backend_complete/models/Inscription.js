// models/Inscription.js
import { db } from '../db.js';
import { inscriptions } from '../schema.js';
import { and, eq } from 'drizzle-orm';

const Inscription = {
  async create({ user_id, event_id }) {
    const exist = await db.select().from(inscriptions)
      .where(and(eq(inscriptions.user_id, user_id), eq(inscriptions.event_id, event_id)));
    if (exist.length) return null; // déjà inscrit

    const [result] = await db.insert(inscriptions).values({ user_id, event_id, status: 'confirmed' });
    const [insc] = await db.select().from(inscriptions).where(eq(inscriptions.id, result.insertId));
    return insc;
  },

  async cancel(id) {
    return db.delete(inscriptions).where(eq(inscriptions.id, id));
  },

  async getByUser(user_id) {
    return db.select().from(inscriptions).where(eq(inscriptions.user_id, user_id));
  }
};

export default Inscription;
