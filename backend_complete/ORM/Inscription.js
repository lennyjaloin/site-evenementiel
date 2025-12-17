export const inscriptions = mysqlTable('inscriptions', {
  id: serial('id').primaryKey(),
  user_id: int('user_id').notNull(),
  event_id: int('event_id').notNull(),
  date_registered: timestamp('date_registered').defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending')
});