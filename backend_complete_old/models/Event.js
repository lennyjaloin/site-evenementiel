// models/Event.js
import { db } from '../db.js';
import { events } from '../schema.js';
import { eq, desc } from 'drizzle-orm';

const Event = {
  async create({ title, description, location, date, price, organizer_id, photos }) {
    await db.insert(events).values({ title, description, location, date, price, organizer_id, photos });
    const [event] = await db.select().from(events).orderBy(desc(events.id)).limit(1);
    return event;
  },

  async findById(id) {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  },

  async getAll() {
    return db.select().from(events).orderBy(desc(events.created_at));
  },

  async update(id, payload) {
    await db.update(events).set(payload).where(eq(events.id, id));
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  },

  async delete(id) {
    return db.delete(events).where(eq(events.id, id));
  }
};

export default Event;
