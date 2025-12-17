// controllers/inscriptionController.js
import { Inscription } from '../models/index.js';

export const createInscription = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { event_id } = req.body;

    const insc = await Inscription.create({ user_id, event_id });
    if (!insc) return res.status(400).json({ message: 'Déjà inscrit' });

    res.status(201).json(insc);
  } catch (err) { next(err); }
};

export const cancelInscription = async (req, res, next) => {
  try {
    await Inscription.cancel(Number(req.params.id));
    res.json({ message: 'Annulé' });
  } catch (err) { next(err); }
};

export const getUserInscriptions = async (req, res, next) => {
  try {
    const list = await Inscription.getByUser(req.user.id);
    res.json(list);
  } catch (err) { next(err); }
};
