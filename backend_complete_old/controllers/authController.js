// controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

import { User } from '../models/index.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe obligatoires' });

    const exist = await User.findByEmail(email);
    if (exist) return res.status(400).json({ message: 'Email déjà utilisé' });

    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password_hash: hash, role });

    res.status(201).json({
      user: { id: newUser.id, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ message: 'Identifiants invalides' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Identifiants invalides' });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
};
