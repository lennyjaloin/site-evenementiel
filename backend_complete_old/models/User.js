// models/User.js
import { db } from '../db.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';

const User = {
  async create({ name, email, password_hash, role = 'participant' }) {
    await db.insert(users).values({ name, email, password_hash, role });
    const [user] = await db.select().from(users).where(eq(users.email, email));
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
