// controllers/reservationController.js
import Reservation from '../models/Reservation.js';

export const createReservation = async (req, res, next) => {
  try {
    const { eventId, event_id, nom, prenom, email } = req.body;
    const payload = {
      event_id: Number(eventId ?? event_id),
      nom,
      prenom,
      email
    };
    const row = await Reservation.create(payload);
    res.status(201).json(row);
  } catch (err) {
    // Erreur avec status personnalisé (capacité, not found)
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    // Erreur d'unicité MySQL (double réservation)
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Déjà réservé avec cet email.' });
    }
    next(err);
  }
};

export const listReservations = async (req, res, next) => {
  try {
    const rows = await Reservation.getAll();
    res.json(rows);
  } catch (err) { next(err); }
};

export const deleteReservation = async (req, res, next) => {
  try {
    await Reservation.delete(Number(req.params.id));
    res.json({ message: 'Supprimé' });
  } catch (err) { next(err); }
};