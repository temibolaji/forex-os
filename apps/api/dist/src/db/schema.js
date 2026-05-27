"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checklistSnapshots = exports.checklistTemplates = exports.tradeEntries = exports.tradingAccounts = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    passwordHash: (0, pg_core_1.varchar)('password_hash', { length: 255 }).notNull(),
    accountCurrency: (0, pg_core_1.varchar)('account_currency', { length: 3 }).default('USD'),
    timezone: (0, pg_core_1.varchar)('timezone', { length: 64 }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
exports.tradingAccounts = (0, pg_core_1.pgTable)('trading_accounts', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(() => exports.users.id),
    label: (0, pg_core_1.varchar)('label', { length: 100 }).notNull(),
    brokerName: (0, pg_core_1.varchar)('broker_name', { length: 100 }),
    initialBalance: (0, pg_core_1.decimal)('initial_balance', { precision: 14, scale: 2 }).notNull(),
    accountCurrency: (0, pg_core_1.varchar)('account_currency', { length: 3 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
exports.tradeEntries = (0, pg_core_1.pgTable)('trade_entries', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    accountId: (0, pg_core_1.uuid)('account_id').notNull().references(() => exports.tradingAccounts.id),
    pair: (0, pg_core_1.varchar)('pair', { length: 10 }).notNull(),
    direction: (0, pg_core_1.varchar)('direction', { enum: ['LONG', 'SHORT'] }).notNull(),
    entryPrice: (0, pg_core_1.decimal)('entry_price', { precision: 10, scale: 5 }).notNull(),
    exitPrice: (0, pg_core_1.decimal)('exit_price', { precision: 10, scale: 5 }),
    slPrice: (0, pg_core_1.decimal)('sl_price', { precision: 10, scale: 5 }).notNull(),
    tpPrice: (0, pg_core_1.decimal)('tp_price', { precision: 10, scale: 5 }),
    lotSize: (0, pg_core_1.decimal)('lot_size', { precision: 10, scale: 2 }).notNull(),
    pipsRisked: (0, pg_core_1.decimal)('pips_risked', { precision: 6, scale: 1 }),
    pipsResult: (0, pg_core_1.decimal)('pips_result', { precision: 6, scale: 1 }),
    pnlUsd: (0, pg_core_1.decimal)('pnl_usd', { precision: 10, scale: 2 }),
    rrPlanned: (0, pg_core_1.decimal)('rr_planned', { precision: 4, scale: 2 }),
    rrActual: (0, pg_core_1.decimal)('rr_actual', { precision: 4, scale: 2 }),
    session: (0, pg_core_1.varchar)('session', { enum: ['LONDON', 'NEW_YORK', 'TOKYO', 'SYDNEY', 'OTHER'] }).notNull(),
    setupTags: (0, pg_core_1.text)('setup_tags').array(),
    emotionalState: (0, pg_core_1.integer)('emotional_state'),
    notes: (0, pg_core_1.text)('notes'),
    screenshotUrl: (0, pg_core_1.varchar)('screenshot_url', { length: 500 }),
    checklistSnapshotId: (0, pg_core_1.uuid)('checklist_snapshot_id'), // Will reference checklist_snapshots in Phase 2
    openedAt: (0, pg_core_1.timestamp)('opened_at', { withTimezone: true }).notNull(),
    closedAt: (0, pg_core_1.timestamp)('closed_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
exports.checklistTemplates = (0, pg_core_1.pgTable)('checklist_templates', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(() => exports.users.id),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    rules: (0, pg_core_1.text)('rules').notNull(), // Will store JSON stringified array of { id, text, required }
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
exports.checklistSnapshots = (0, pg_core_1.pgTable)('checklist_snapshots', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    templateId: (0, pg_core_1.uuid)('template_id').notNull().references(() => exports.checklistTemplates.id),
    tradeId: (0, pg_core_1.uuid)('trade_id'), // Cannot reference tradeEntries directly to avoid circular dependency in Drizzle, or we can use AnyPgColumn.
    responses: (0, pg_core_1.text)('responses').notNull(), // JSON stringified array of { rule_id, passed }
    overallPassed: (0, pg_core_1.boolean)('overall_passed').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
