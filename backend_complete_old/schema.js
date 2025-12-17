// schema.js
import {
  mysqlTable,
  serial,
  varchar,
  text,
  int,
  timestamp,
  decimal
} from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('participant'),
  created_at: timestamp('created_at').defaultNow()
});

export const events = mysqlTable('events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 255 }),
  date: timestamp('date'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull().default(0),
  organizer_id: int('organizer_id').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  photos: text('photos')
});

export const inscriptions = mysqlTable('inscriptions', {
  id: serial('id').primaryKey(),
  user_id: int('user_id').notNull(),
  event_id: int('event_id').notNull(),
  date_registered: timestamp('date_registered').defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending')
});

export const payments = mysqlTable('payments', {
  id: serial('id').primaryKey(),
  user_id: int('user_id').notNull(),
  event_id: int('event_id').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  payment_date: timestamp('payment_date').defaultNow()
});

// Reservations anonymes (nom/prenom/email)
export const reservations = mysqlTable('reservations', {
  id: serial('id').primaryKey(),
  event_id: int('event_id').notNull(),
  nom: varchar('nom', { length: 80 }).notNull(),
  prenom: varchar('prenom', { length: 80 }).notNull(),
  email: varchar('email', { length: 120 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('confirmed'),
  created_at: timestamp('created_at').defaultNow(),
});
