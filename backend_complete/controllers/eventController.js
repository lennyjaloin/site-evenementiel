// controllers/eventController.js
import Event from '../models/Event.js';
import { parsePagination, paginatedResponse } from '../utils/paginate.js';

export const listEvents = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await Event.getAllPaginated({ limit, offset });
    res.json(paginatedResponse(data, total, page, limit));
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
      capacity = null,
      image_url = null,
      is_public = 1
    } = req.body;

    const date_start = req.body.date_start ? new Date(req.body.date_start) : null;
    const date_end = req.body.date_end ? new Date(req.body.date_end) : null;

    const created = await Event.create({
      title,
      description,
      location,
      date_start,
      date_end,
      capacity,
      image_url,
      is_public,
      created_by: req.user.id
    });

    res.status(201).json(created);
  } catch (err) { next(err); }
};

export const updateEvent = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Événement introuvable' });

    if (req.user.role !== 'admin' && event.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const allowedFields = ['title', 'description', 'location', 'capacity', 'image_url', 'is_public'];
    const payload = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) payload[key] = req.body[key];
    }
    if (req.body.date_start !== undefined) {
      payload.date_start = req.body.date_start ? new Date(req.body.date_start) : null;
    }
    if (req.body.date_end !== undefined) {
      payload.date_end = req.body.date_end ? new Date(req.body.date_end) : null;
    }

    const updated = await Event.update(id, payload);
    res.json(updated);
  } catch (err) { next(err); }
};

export const deleteEvent = async (req, res, next) => {
  try {
    await Event.delete(Number(req.params.id));
    res.json({ message: 'Supprimé' });
  } catch (err) { next(err); }
};