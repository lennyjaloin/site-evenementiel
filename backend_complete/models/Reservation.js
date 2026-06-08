// models/Reservation.js
import { db } from '../db.js';
import { reservations, events } from '../schema.js';
import { eq, and, count, desc } from 'drizzle-orm';

const Reservation = {
  async create({ event_id, nom, prenom, email }) {
    const [ev] = await db.select().from(events).where(eq(events.id, event_id));
    if (!ev) throw Object.assign(new Error('Evenement introuvable'), { status: 404 });

    const [existing] = await db
      .select()
      .from(reservations)
      .where(and(eq(reservations.event_id, event_id), eq(reservations.email, email)));

    if (existing && existing.status === 'confirmed') {
      throw Object.assign(new Error('Déjà réservé avec cet email.'), { status: 400 });
    }

    if (ev.capacity != null) {
      const [{ total }] = await db
        .select({ total: count() })
        .from(reservations)
        .where(
          and(
            eq(reservations.event_id, event_id),
            eq(reservations.status, 'confirmed')
          )
        );
      if (total >= ev.capacity) {
        throw Object.assign(
          new Error(`Evenement complet (${ev.capacity} places). Plus de places disponibles.`),
          { status: 400 }
        );
      }
    }

    if (existing) {
      await db
        .update(reservations)
        .set({ nom, prenom, status: 'confirmed' })
        .where(eq(reservations.id, existing.id));
      const [row] = await db.select().from(reservations).where(eq(reservations.id, existing.id));
      return row;
    }

    const [result] = await db
      .insert(reservations)
      .values({ event_id, nom, prenom, email, status: 'confirmed' });
    const [row] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, result.insertId));
    return row;
  },

  async getAll() {
    return db
      .select({
        id: reservations.id,
        eventId: reservations.event_id,
        eventTitle: events.title,
        nom: reservations.nom,
        prenom: reservations.prenom,
        email: reservations.email,
        status: reservations.status,
        createdAt: reservations.created_at,
      })
      .from(reservations)
      .leftJoin(events, eq(reservations.event_id, events.id))
      .orderBy(desc(reservations.created_at));
  },

  async findById(id) {
    const [row] = await db.select().from(reservations).where(eq(reservations.id, id));
    return row;
  },

  async cancel(id) {
    return db.update(reservations).set({ status: 'cancelled' }).where(eq(reservations.id, id));
  },

  async restore(id) {
    return db.update(reservations).set({ status: 'confirmed' }).where(eq(reservations.id, id));
  },

  async delete(id) {
    return db.delete(reservations).where(eq(reservations.id, id));
  },

  async countConfirmedByEmail(email) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(reservations)
      .where(
        and(
          eq(reservations.email, email),
          eq(reservations.status, 'confirmed')
        )
      );
    return total;
  },

  async countByEvent(event_id) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(reservations)
      .where(
        and(
          eq(reservations.event_id, event_id),
          eq(reservations.status, 'confirmed')
        )
      );
    return total;
  },
};

export default Reservation;