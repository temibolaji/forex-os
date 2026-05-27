"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = calendarRoutes;
const typebox_1 = require("@sinclair/typebox");
const CalendarQuerySchema = {
    querystring: typebox_1.Type.Object({
        from: typebox_1.Type.Optional(typebox_1.Type.String({ format: 'date-time' })),
        to: typebox_1.Type.Optional(typebox_1.Type.String({ format: 'date-time' })),
        currencies: typebox_1.Type.Optional(typebox_1.Type.String()), // Comma separated, e.g., "USD,EUR"
        impact: typebox_1.Type.Optional(typebox_1.Type.Union([
            typebox_1.Type.Literal('HIGH'),
            typebox_1.Type.Literal('MEDIUM'),
            typebox_1.Type.Literal('LOW'),
            typebox_1.Type.Literal('ALL')
        ])),
    })
};
async function calendarRoutes(server) {
    server.get('/api/v1/calendar', {
        preValidation: [server.authenticate],
        schema: CalendarQuerySchema,
    }, async (request, reply) => {
        const { from, to, currencies, impact } = request.query;
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
            const allowedCurrencies = currencies.split(',').map((c) => c.toUpperCase().trim());
            events = events.filter((e) => allowedCurrencies.includes(e.currency));
        }
        if (impact && impact !== 'ALL') {
            events = events.filter((e) => e.impact === impact);
        }
        if (from) {
            events = events.filter((e) => new Date(e.scheduledAt) >= new Date(from));
        }
        if (to) {
            events = events.filter((e) => new Date(e.scheduledAt) <= new Date(to));
        }
        return reply.send({ data: events });
    });
}
