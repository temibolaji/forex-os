import { FastifyInstance } from 'fastify';

// Define sessions using UTC hours (0-23)
// Note: In reality, Daylight Saving Time (DST) complicates this. We use standard approximations.
const SESSIONS = [
  { name: 'SYDNEY', startUtc: 22, endUtc: 7 },
  { name: 'TOKYO', startUtc: 0, endUtc: 9 },
  { name: 'LONDON', startUtc: 8, endUtc: 17 },
  { name: 'NEW_YORK', startUtc: 13, endUtc: 22 },
];

function isSessionActive(currentHourUtc: number, start: number, end: number) {
  if (start < end) {
    return currentHourUtc >= start && currentHourUtc < end;
  } else {
    // Crosses midnight UTC
    return currentHourUtc >= start || currentHourUtc < end;
  }
}

export default async function sessionRoutes(server: FastifyInstance) {
  server.get(
    '/api/v1/sessions/current',
    async (request, reply) => {
      const now = new Date();
      const currentHourUtc = now.getUTCHours();
      
      const activeSessions = SESSIONS.filter(s => isSessionActive(currentHourUtc, s.startUtc, s.endUtc)).map(s => s.name);
      
      const isOverlap = activeSessions.length > 1;

      return reply.send({
        currentHourUtc,
        activeSessions,
        isOverlap,
      });
    }
  );
}
