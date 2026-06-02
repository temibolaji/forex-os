"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = calendarRoutes;
async function calendarRoutes(fastify) {
    fastify.get('/api/v1/calendar', async (request, reply) => {
        try {
            // Proxy the request to the free Forex Factory JSON feed
            const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
            if (!response.ok) {
                throw new Error(`Failed to fetch calendar data: ${response.statusText}`);
            }
            const data = await response.json();
            return reply.send(data);
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch economic calendar' });
        }
    });
}
