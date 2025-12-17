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
    const organizer_id = req.user.id;
    const { title, description, location, date, price, photos } = req.body;

    const created = await Event.create({
      title, description, location, date, price, organizer_id, photos
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
