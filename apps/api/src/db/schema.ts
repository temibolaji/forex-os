import { pgTable, uuid, varchar, decimal, timestamp, text, integer, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  accountCurrency: varchar('account_currency', { length: 3 }).default('USD'),
  timezone: varchar('timezone', { length: 64 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tradingAccounts = pgTable('trading_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  label: varchar('label', { length: 100 }).notNull(),
  brokerName: varchar('broker_name', { length: 100 }),
  initialBalance: decimal('initial_balance', { precision: 14, scale: 2 }).notNull(),
  accountCurrency: varchar('account_currency', { length: 3 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tradeEntries = pgTable('trade_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => tradingAccounts.id),
  pair: varchar('pair', { length: 10 }).notNull(),
  direction: varchar('direction', { enum: ['LONG', 'SHORT'] }).notNull(),
  entryPrice: decimal('entry_price', { precision: 10, scale: 5 }).notNull(),
  exitPrice: decimal('exit_price', { precision: 10, scale: 5 }),
  slPrice: decimal('sl_price', { precision: 10, scale: 5 }).notNull(),
  tpPrice: decimal('tp_price', { precision: 10, scale: 5 }),
  lotSize: decimal('lot_size', { precision: 10, scale: 2 }).notNull(),
  pipsRisked: decimal('pips_risked', { precision: 6, scale: 1 }),
  pipsResult: decimal('pips_result', { precision: 6, scale: 1 }),
  pnlUsd: decimal('pnl_usd', { precision: 10, scale: 2 }),
  rrPlanned: decimal('rr_planned', { precision: 4, scale: 2 }),
  rrActual: decimal('rr_actual', { precision: 4, scale: 2 }),
  session: varchar('session', { enum: ['LONDON', 'NEW_YORK', 'TOKYO', 'SYDNEY', 'OTHER'] }).notNull(),
  setupTags: text('setup_tags').array(),
  emotionalState: integer('emotional_state'),
  notes: text('notes'),
  screenshotUrl: varchar('screenshot_url', { length: 500 }),
  checklistSnapshotId: uuid('checklist_snapshot_id'), // Will reference checklist_snapshots in Phase 2
  openedAt: timestamp('opened_at', { withTimezone: true }).notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const checklistTemplates = pgTable('checklist_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  rules: text('rules').notNull(), // Will store JSON stringified array of { id, text, required }
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const checklistSnapshots = pgTable('checklist_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => checklistTemplates.id),
  tradeId: uuid('trade_id'), // Cannot reference tradeEntries directly to avoid circular dependency in Drizzle, or we can use AnyPgColumn.
  responses: text('responses').notNull(), // JSON stringified array of { rule_id, passed }
  overallPassed: boolean('overall_passed').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
