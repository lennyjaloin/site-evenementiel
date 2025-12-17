export const payments = mysqlTable('payments', {
  id: serial('id').primaryKey(),
  user_id: int('user_id').notNull(),
  event_id: int('event_id').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  payment_date: timestamp('payment_date').defaultNow()
});