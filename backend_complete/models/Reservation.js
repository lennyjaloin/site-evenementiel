// models/Reservation.js
import { db } from '../db.js';
import { reservations, events } from '../schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';

const Reservation = {
  async create({ event_id, nom, prenom, email }) {
    // Optionnel: vérifier que l'event existe
    const [ev] = await db.select().from(events).where(eq(events.id, event_id));
    if (!ev) throw Object.assign(new Error("Événement introuvable"), { status: 404 });

    // insert, en laissant MySQL gérer l'unicité (event_id, email) si tu l'as mise au niveau DB
    await db.insert(reservations).values({ event_id, nom, prenom, email, status: 'confirmed' });
    const [row] = await db.select().from(reservations).orderBy(desc(reservations.id)).limit(1);
    return row;
  },

  async getAll() {
    // petit join pour afficher le titre en admin
    return db.select({
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

  async delete(id) {
    return db.delete(reservations).where(eq(reservations.id, id));
  }
};

export default Reservation;
