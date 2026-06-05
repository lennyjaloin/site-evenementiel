// models/User.js
import { db } from '../db.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';

const User = {
  async create({ username = null, email, password_hash, role = 'admin', is_active = 1 }) {
    const [result] = await db.insert(users).values({ username, email, password_hash, role, is_active });
    const [user] = await db.select().from(users).where(eq(users.id, result.insertId));
    return user;
  },

  async findByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  async findById(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async getAll() {
    return db.select().from(users);
  },

  async deleteById(id) {
    return db.delete(users).where(eq(users.id, id));
  }
};

export default User;
