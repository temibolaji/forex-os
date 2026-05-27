"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockTradeEntries = void 0;
exports.default = journalRoutes;
const typebox_1 = require("@sinclair/typebox");
const crypto_1 = __importDefault(require("crypto"));
const formulas_1 = require("../utils/formulas");
const checklist_1 = require("./checklist");
const CreateJournalSchema = {
    body: typebox_1.Type.Object({
        accountId: typebox_1.Type.String(),
        pair: typebox_1.Type.String({ maxLength: 10 }),
        direction: typebox_1.Type.Union([typebox_1.Type.Literal('LONG'), typebox_1.Type.Literal('SHORT')]),
        entryPrice: typebox_1.Type.Number(),
        slPrice: typebox_1.Type.Number(),
        tpPrice: typebox_1.Type.Optional(typebox_1.Type.Number()),
        lotSize: typebox_1.Type.Number(),
        session: typebox_1.Type.Union([
            typebox_1.Type.Literal('LONDON'),
            typebox_1.Type.Literal('NEW_YORK'),
            typebox_1.Type.Literal('TOKYO'),
            typebox_1.Type.Literal('SYDNEY'),
            typebox_1.Type.Literal('OTHER'),
        ]),
        setupTags: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
        emotionalState: typebox_1.Type.Optional(typebox_1.Type.Integer({ minimum: 1, maximum: 5 })),
        notes: typebox_1.Type.Optional(typebox_1.Type.String({ maxLength: 2000 })),
        screenshotUrl: typebox_1.Type.Optional(typebox_1.Type.String()),
        checklistSnapshotId: typebox_1.Type.Optional(typebox_1.Type.String()),
        openedAt: typebox_1.Type.String({ format: 'date-time' }),
    }),
};
const CloseJournalSchema = {
    params: typebox_1.Type.Object({
        id: typebox_1.Type.String(),
    }),
    body: typebox_1.Type.Object({
        exitPrice: typebox_1.Type.Number(),
        closedAt: typebox_1.Type.String({ format: 'date-time' }),
    }),
};
// --- MOCK STORE ---
exports.mockTradeEntries = [];
async function journalRoutes(server) {
    // Get all journal entries
    server.get('/api/v1/journal', {
        preValidation: [server.authenticate],
    }, async (request, reply) => {
        return reply.send({ data: [...exports.mockTradeEntries].reverse(), meta: { total: exports.mockTradeEntries.length, next_cursor: null, limit: 50 } });
    });
    // Create journal entry
    server.post('/api/v1/journal', {
        preValidation: [server.authenticate],
        schema: CreateJournalSchema,
    }, async (request, reply) => {
        const data = request.body;
        // ENFORCE CHECKLIST GATE
        if (data.checklistSnapshotId) {
            const snapshot = checklist_1.mockChecklistSnapshots.find(s => s.id === data.checklistSnapshotId);
            if (!snapshot || !snapshot.overallPassed) {
                return reply.code(422).send({ error: 'CHECKLIST_FAILED', message: 'Trade rejected: Pre-trade checklist failed.' });
            }
        }
        const pipsRisked = (0, formulas_1.calcPipsRisked)(data.entryPrice, data.slPrice, data.pair);
        const rrPlanned = (0, formulas_1.calcRrPlanned)(data.entryPrice, data.slPrice, data.tpPrice);
        const newEntry = {
            id: crypto_1.default.randomUUID(),
            createdAt: new Date(),
            accountId: data.accountId,
            pair: data.pair,
            direction: data.direction,
            entryPrice: data.entryPrice.toString(),
            slPrice: data.slPrice.toString(),
            tpPrice: data.tpPrice?.toString(),
            lotSize: data.lotSize.toString(),
            session: data.session,
            setupTags: data.setupTags || [],
            emotionalState: data.emotionalState,
            notes: data.notes,
            screenshotUrl: data.screenshotUrl,
            checklistSnapshotId: data.checklistSnapshotId,
            openedAt: new Date(data.openedAt),
            pipsRisked: pipsRisked.toString(),
            rrPlanned: rrPlanned?.toString(),
            closedAt: null,
        };
        exports.mockTradeEntries.push(newEntry);
        return reply.code(201).send(newEntry);
    });
    // Close journal entry (PATCH)
    server.patch('/api/v1/journal/:id', {
        preValidation: [server.authenticate],
        schema: CloseJournalSchema,
    }, async (request, reply) => {
        const { id } = request.params;
        const { exitPrice, closedAt } = request.body;
        const tradeIdx = exports.mockTradeEntries.findIndex(t => t.id === id);
        if (tradeIdx === -1) {
            return reply.code(404).send({ error: 'NOT_FOUND' });
        }
        const trade = exports.mockTradeEntries[tradeIdx];
        if (trade.closedAt) {
            return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Trade already closed' });
        }
        const pipsResult = (0, formulas_1.calcPipsResult)(parseFloat(trade.entryPrice), exitPrice, trade.direction, trade.pair);
        const pipsRisked = parseFloat(trade.pipsRisked);
        const rrActual = (0, formulas_1.calcRrActual)(pipsResult, pipsRisked);
        const pnlUsd = await (0, formulas_1.calcPnlUsd)(pipsResult, trade.pair, parseFloat(trade.lotSize));
        const updatedEntry = {
            ...trade,
            exitPrice: exitPrice.toString(),
            closedAt: new Date(closedAt),
            pipsResult: pipsResult.toString(),
            rrActual: rrActual?.toString(),
            pnlUsd: pnlUsd.toString(),
        };
        exports.mockTradeEntries[tradeIdx] = updatedEntry;
        return reply.send(updatedEntry);
    });
    // Delete journal entry
    server.delete('/api/v1/journal/:id', {
        preValidation: [server.authenticate],
    }, async (request, reply) => {
        const { id } = request.params;
        const tradeIdx = exports.mockTradeEntries.findIndex(t => t.id === id);
        if (tradeIdx !== -1) {
            exports.mockTradeEntries.splice(tradeIdx, 1);
        }
        return reply.code(204).send();
    });
}
