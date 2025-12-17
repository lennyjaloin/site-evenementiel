// controllers/eventController.js
import { Event } from '../models/index.js';

export const listEvents = async (req, res, next) => {
  try {
    const all = await Event.getAll();
    res.json(all);
  } catch (err) { next(err); }
};

export const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(Number(req.params.id));
    if (!event) return res.status(404).json({ message: 'Événement introuvable' });
    res.json(event);
  } catch (err) { next(err); }
};

export const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      location,
      date_start = null,
      date_end = null,
      capacity = null,
      image_url = null,
      is_public = 1
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Titre et description obligatoires" });
    }

    const created = await Event.create({
      title,
      description,
      location,
      date_start,
      date_end,
      capacity,
      image_url,
      is_public
    });

    res.status(201).json(created);
  } catch (err) { next(err); }
};

export const updateEvent = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const updated = await Event.update(id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
};

export const deleteEvent = async (req, res, next) => {
  try {
    await Event.delete(Number(req.params.id));
    res.json({ message: 'Supprimé' });
  } catch (err) { next(err); }
};
