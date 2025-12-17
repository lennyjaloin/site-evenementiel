// controllers/userController.js
import { User } from '../models/index.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (err) { next(err); }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(Number(req.params.id));
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) { next(err); }
};

export const deleteUser = async (req, res, next) => {
  try {
    await User.deleteById(Number(req.params.id));
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) { next(err); }
};
