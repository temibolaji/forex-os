import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import cors from '@fastify/cors';
import * as dotenv from 'dotenv';
import authRoutes from './routes/auth';
import journalRoutes from './routes/journal';
import positionSizeRoutes from './routes/positionSize';
import checklistRoutes from './routes/checklist';

import calendarRoutes from './routes/calendar';
import sessionRoutes from './routes/sessions';
import pipCalcRoutes from './routes/pipCalc';
import analyticsRoutes from './routes/analytics';
import coachRoutes from './routes/coach';

dotenv.config();

const server = Fastify({
  logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

// Register Plugins
server.register(cors, {
  origin: true, // Allow all origins for now (or change to your Vercel URL later)
  credentials: true,
});

server.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET || 'supersecretcookie',
});

server.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecret',
});

server.decorate('authenticate', async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Register Routes
server.register(authRoutes);
server.register(journalRoutes);
server.register(positionSizeRoutes);
server.register(checklistRoutes);
server.register(calendarRoutes);
server.register(sessionRoutes);
server.register(pipCalcRoutes);
server.register(analyticsRoutes);
server.register(coachRoutes);

// Health check route
server.get('/health', async () => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3005', 10);
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
