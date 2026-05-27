import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';

const CalendarQuerySchema = {
  querystring: Type.Object({
    from: Type.Optional(Type.String({ format: 'date-time' })),
    to: Type.Optional(Type.String({ format: 'date-time' })),
    currencies: Type.Optional(Type.String()), // Comma separated, e.g., "USD,EUR"
    impact: Type.Optional(Type.Union([
      Type.Literal('HIGH'),
      Type.Literal('MEDIUM'),
      Type.Literal('LOW'),
      Type.Literal('ALL')
    ])),
  })
};

export default async function calendarRoutes(server: FastifyInstance) {
  server.get(
    '/api/v1/calendar',
    {
      preValidation: [(server as any).authenticate],
      schema: CalendarQuerySchema,
    },
    async (request, reply) => {
      const { from, to, currencies, impact } = request.query as any;

      // Simple mock data fallback
      let events = [
        {
          id: '1',
          name: 'Nonfarm Payrolls',
          currency: 'USD',
          impact: 'HIGH',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          forecast: '180K',
          previous: '150K',
          actual: null,
        },
        {
          id: '2',
          name: 'ECB Interest Rate Decision',
          currency: 'EUR',
          impact: 'HIGH',
          scheduledAt: new Date(Date.now() + 172800000).toISOString(),
          forecast: '4.5%',
          previous: '4.5%',
          actual: null,
        }
      ];

      // Filter events
      if (currencies) {
        const allowedCurrencies = currencies.split(',').map((c: string) => c.toUpperCase().trim());
        events = events.filter((e: any) => allowedCurrencies.includes(e.currency));
      }
      
      if (impact && impact !== 'ALL') {
        events = events.filter((e: any) => e.impact === impact);
      }
      
      if (from) {
        events = events.filter((e: any) => new Date(e.scheduledAt) >= new Date(from));
      }
      
      if (to) {
        events = events.filter((e: any) => new Date(e.scheduledAt) <= new Date(to));
      }

      return reply.send({ data: events });
    }
  );
}
