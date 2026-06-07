// controllers/reservationController.js
import Reservation from '../models/Reservation.js';
import User from '../models/User.js';

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
    if (err?.code === 'ER_DUP_ENTRY' || err?.errno === 1062) {
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

export const cancelReservation = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const reservation = await Reservation.findById(id);
    if (!reservation) return res.status(404).json({ message: 'Réservation introuvable' });

    if (req.user.role !== 'admin') {
      const user = await User.findById(req.user.id);
      if (!user || user.email !== reservation.email) {
        return res.status(403).json({ message: 'Accès refusé' });
      }
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ message: 'Réservation déjà annulée' });
    }

    await Reservation.cancel(id);
    res.json({ message: 'Réservation annulée' });
  } catch (err) { next(err); }
};

export const deleteReservation = async (req, res, next) => {
  try {
    await Reservation.delete(Number(req.params.id));
    res.json({ message: 'Supprimé' });
  } catch (err) { next(err); }
};