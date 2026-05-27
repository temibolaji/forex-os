import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import crypto from 'crypto';
import {
  calcPipsRisked,
  calcPipsResult,
  calcRrPlanned,
  calcRrActual,
  calcPnlUsd,
} from '../utils/formulas';
import { mockChecklistSnapshots } from './checklist';

const CreateJournalSchema = {
  body: Type.Object({
    accountId: Type.String(),
    pair: Type.String({ maxLength: 10 }),
    direction: Type.Union([Type.Literal('LONG'), Type.Literal('SHORT')]),
    entryPrice: Type.Number(),
    slPrice: Type.Number(),
    tpPrice: Type.Optional(Type.Number()),
    lotSize: Type.Number(),
    session: Type.Union([
      Type.Literal('LONDON'),
      Type.Literal('NEW_YORK'),
      Type.Literal('TOKYO'),
      Type.Literal('SYDNEY'),
      Type.Literal('OTHER'),
    ]),
    setupTags: Type.Optional(Type.Array(Type.String())),
    emotionalState: Type.Optional(Type.Integer({ minimum: 1, maximum: 5 })),
    notes: Type.Optional(Type.String({ maxLength: 2000 })),
    screenshotUrl: Type.Optional(Type.String()),
    checklistSnapshotId: Type.Optional(Type.String()),
    openedAt: Type.String({ format: 'date-time' }),
  }),
};

const CloseJournalSchema = {
  params: Type.Object({
    id: Type.String(),
  }),
  body: Type.Object({
    exitPrice: Type.Number(),
    closedAt: Type.String({ format: 'date-time' }),
  }),
};

// --- MOCK STORE ---
export const mockTradeEntries: any[] = [];

export default async function journalRoutes(server: FastifyInstance) {
  // Get all journal entries
  server.get(
    '/api/v1/journal',
    {
      preValidation: [(server as any).authenticate],
    },
    async (request, reply) => {
      return reply.send({ data: [...mockTradeEntries].reverse(), meta: { total: mockTradeEntries.length, next_cursor: null, limit: 50 } });
    }
  );

  // Create journal entry
  server.post(
    '/api/v1/journal',
    {
      preValidation: [(server as any).authenticate],
      schema: CreateJournalSchema,
    },
    async (request, reply) => {
      const data = request.body as any;

      // ENFORCE CHECKLIST GATE
      if (data.checklistSnapshotId) {
        const snapshot = mockChecklistSnapshots.find(s => s.id === data.checklistSnapshotId);
        if (!snapshot || !snapshot.overallPassed) {
          return reply.code(422).send({ error: 'CHECKLIST_FAILED', message: 'Trade rejected: Pre-trade checklist failed.' });
        }
      }

      const pipsRisked = calcPipsRisked(data.entryPrice, data.slPrice, data.pair);
      const rrPlanned = calcRrPlanned(data.entryPrice, data.slPrice, data.tpPrice);

      const newEntry = {
        id: crypto.randomUUID(),
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

      mockTradeEntries.push(newEntry);

      return reply.code(201).send(newEntry);
    }
  );

  // Close journal entry (PATCH)
  server.patch(
    '/api/v1/journal/:id',
    {
      preValidation: [(server as any).authenticate],
      schema: CloseJournalSchema,
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const { exitPrice, closedAt } = request.body as any;

      const tradeIdx = mockTradeEntries.findIndex(t => t.id === id);
      if (tradeIdx === -1) {
        return reply.code(404).send({ error: 'NOT_FOUND' });
      }

      const trade = mockTradeEntries[tradeIdx];
      if (trade.closedAt) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Trade already closed' });
      }

      const pipsResult = calcPipsResult(
        parseFloat(trade.entryPrice as string),
        exitPrice,
        trade.direction as 'LONG' | 'SHORT',
        trade.pair
      );
      
      const pipsRisked = parseFloat(trade.pipsRisked as string);
      const rrActual = calcRrActual(pipsResult, pipsRisked);
      const pnlUsd = await calcPnlUsd(pipsResult, trade.pair, parseFloat(trade.lotSize as string));

      const updatedEntry = {
        ...trade,
        exitPrice: exitPrice.toString(),
        closedAt: new Date(closedAt),
        pipsResult: pipsResult.toString(),
        rrActual: rrActual?.toString(),
        pnlUsd: pnlUsd.toString(),
      };

      mockTradeEntries[tradeIdx] = updatedEntry;

      return reply.send(updatedEntry);
    }
  );

  // Delete journal entry
  server.delete(
    '/api/v1/journal/:id',
    {
      preValidation: [(server as any).authenticate],
    },
    async (request, reply) => {
      const { id } = (request.params as any);
      const tradeIdx = mockTradeEntries.findIndex(t => t.id === id);
      if (tradeIdx !== -1) {
        mockTradeEntries.splice(tradeIdx, 1);
      }
      return reply.code(204).send();
    }
  );
}
