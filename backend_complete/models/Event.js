// models/Event.js
import { db } from '../db.js';
import { events, reservations } from '../schema.js';
import { eq, desc, count, and } from 'drizzle-orm';

const Event = {
  async create({
    title,
    description,
    location = null,
    date_start = null,
    date_end = null,
    capacity = null,
    image_url = null,
    is_public = 1
  }) {
    const [result] = await db.insert(events).values({
      title,
      description,
      location,
      date_start,
      date_end,
      capacity,
      image_url,
      is_public
    });
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, result.insertId));
    return event;
  },

  async findById(id) {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (!event) return null;

    const [{ total }] = await db
      .select({ total: count() })
      .from(reservations)
      .where(
        and(
          eq(reservations.event_id, id),
          eq(reservations.status, 'confirmed')
        )
      );

    return {
      ...event,
      reservationsCount: total,
      placesRestantes:
        event.capacity != null ? event.capacity - total : null,
    };
  },

  async getAll() {
    const eventsList = await db
      .select()
      .from(events)
      .orderBy(desc(events.created_at));

    const enriched = await Promise.all(
      eventsList.map(async (event) => {
        const [{ total }] = await db
          .select({ total: count() })
          .from(reservations)
          .where(
            and(
              eq(reservations.event_id, event.id),
              eq(reservations.status, 'confirmed')
            )
          );

        return {
          ...event,
          reservationsCount: total,
          placesRestantes:
            event.capacity != null ? event.capacity - total : null,
        };
      })
    );

    return enriched;
  },

  async getAllPaginated({ limit, offset }) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(events);

    const eventsList = await db
      .select()
      .from(events)
      .orderBy(desc(events.created_at))
      .limit(limit)
      .offset(offset);

    const enriched = await Promise.all(
      eventsList.map(async (event) => {
        const [{ total: resCount }] = await db
          .select({ total: count() })
          .from(reservations)
          .where(
            and(
              eq(reservations.event_id, event.id),
              eq(reservations.status, 'confirmed')
            )
          );

        return {
          ...event,
          reservationsCount: resCount,
          placesRestantes:
            event.capacity != null ? event.capacity - resCount : null,
        };
      })
    );

    return { data: enriched, total };
  },

  async update(id, payload) {
    await db.update(events).set(payload).where(eq(events.id, id));
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  },

  async delete(id) {
    return db.delete(events).where(eq(events.id, id));
  },
};

export default Event;