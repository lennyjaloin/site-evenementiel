// schema.js (Drizzle) — aligné avec la base MySQL "evenement" (dump fourni)
import {
  mysqlTable,
  serial,
  int,
  varchar,
  text,
  datetime,
  timestamp,
  mysqlEnum,
  decimal,
} from 'drizzle-orm/mysql-core';

// users (dump): id, username, email, password_hash, role(enum admin|staff), is_active, created_at, updated_at
export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 60 }).notNull(),
  email: varchar('email', { length: 120 }).notNull(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['admin', 'staff']).notNull().default('admin'),
  is_active: int('is_active').notNull().default(1),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// events (dump): title, description, date_start, date_end, location, capacity, image_url, is_public, created_at, updated_at
export const events = mysqlTable('events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 150 }).notNull(),
  description: text('description').notNull(),
  date_start: datetime('date_start'),
  date_end: datetime('date_end'),
  location: varchar('location', { length: 180 }),
  capacity: int('capacity'),
  image_url: varchar('image_url', { length: 255 }),
  is_public: int('is_public').notNull().default(1),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// reservations (dump): unique (event_id, email), status enum confirmed|cancelled
export const reservations = mysqlTable('reservations', {
  id: serial('id').primaryKey(),
  event_id: int('event_id').notNull(),
  nom: varchar('nom', { length: 80 }).notNull(),
  prenom: varchar('prenom', { length: 80 }).notNull(),
  email: varchar('email', { length: 120 }).notNull(),
  status: mysqlEnum('status', ['confirmed', 'cancelled']).notNull().default('confirmed'),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// inscriptions (dump)
export const inscriptions = mysqlTable('inscriptions', {
  id: serial('id').primaryKey(),
  user_id: int('user_id').notNull(),
  event_id: int('event_id').notNull(),
  date_registered: timestamp('date_registered').defaultNow(),
  status: varchar('status', { length: 20 }).default('pending'),
});

// payments (dump)
export const payments = mysqlTable('payments', {
  id: serial('id').primaryKey(),
  user_id: int('user_id').notNull(),
  event_id: int('event_id').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).default('0.00'),
  status: varchar('status', { length: 20 }).default('pending'),
  payment_date: timestamp('payment_date').defaultNow(),
});
