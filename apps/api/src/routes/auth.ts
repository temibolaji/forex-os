import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { redis } from '../cache';

const RegisterSchema = {
  body: Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 8 }),
    accountCurrency: Type.Optional(Type.String({ minLength: 3, maxLength: 3 })),
    timezone: Type.Optional(Type.String()),
  }),
  response: {
    201: Type.Object({
      id: Type.String(),
      email: Type.String(),
    }),
    400: Type.Object({
      error: Type.String(),
      message: Type.String(),
    }),
  },
};

const LoginSchema = {
  body: Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String(),
  }),
  response: {
    200: Type.Object({
      accessToken: Type.String(),
      user: Type.Object({
        id: Type.String(),
        email: Type.String(),
      }),
    }),
    401: Type.Object({
      error: Type.String(),
      message: Type.String(),
    }),
  },
};

const ChangePasswordSchema = {
  body: Type.Object({
    oldPassword: Type.String(),
    newPassword: Type.String({ minLength: 8 }),
  }),
  response: {
    200: Type.Object({
      message: Type.String(),
    }),
    400: Type.Object({
      error: Type.String(),
      message: Type.String(),
    }),
    401: Type.Object({
      error: Type.String(),
      message: Type.String(),
    }),
  },
};

export default async function authRoutes(server: FastifyInstance) {
  server.post('/api/v1/auth/register', { schema: RegisterSchema }, async (request, reply) => {
    const { email, password, accountCurrency, timezone } = request.body as any;
    
    // Check global user cap (strictly 10 users for free tier efficiency)
    const [userCountResult] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    if (userCountResult.count >= 10) {
      return reply.code(400).send({ error: 'CAP_REACHED', message: 'Registration cap reached! This terminal is strictly limited to 10 users for free hosting efficiency.' });
    }

    // Check if email already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, email));
    if (existingUser) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      email,
      passwordHash,
      accountCurrency: accountCurrency || 'USD',
      timezone: timezone || 'UTC',
    }).returning({ id: users.id, email: users.email });

    return reply.code(201).send({ id: newUser.id, email: newUser.email });
  });

  server.post('/api/v1/auth/login', { schema: LoginSchema }, async (request, reply) => {
    const { email, password } = request.body as any;
    
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    const accessToken = server.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '15m' });
    
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const REFRESH_TTL = 30 * 24 * 60 * 60; // 30 days
    await redis.set(`rt:${refreshToken}`, user.id, 'EX', REFRESH_TTL);
    
    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/api/v1/auth',
      maxAge: REFRESH_TTL,
    });
    
    return reply.code(200).send({
      accessToken,
      user: { id: user.id, email: user.email },
    });
  });

  server.post('/api/v1/auth/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'No refresh token' });
    }

    const userId = await redis.get(`rt:${refreshToken}`);
    if (!userId) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Invalid or expired refresh token' });
    }

    // Verify user still exists
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'User not found' });
    }

    const newAccessToken = server.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '15m' });
    return reply.code(200).send({ accessToken: newAccessToken });
  });

  server.post(
    '/api/v1/auth/change-password',
    { schema: ChangePasswordSchema, onRequest: [(server as any).authenticate] },
    async (request, reply) => {
      const { oldPassword, newPassword } = request.body as any;
      const userPayload = request.user as any; // attached by fastify-jwt

      const [user] = await db.select().from(users).where(eq(users.id, userPayload.sub));
      if (!user) {
        return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'User not found' });
      }

      const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!isValid) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Incorrect old password' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

      return reply.code(200).send({ message: 'Password updated successfully' });
    }
  );

  server.post('/api/v1/auth/logout', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    if (refreshToken) {
      await redis.del(`rt:${refreshToken}`);
      reply.clearCookie('refreshToken', { 
        path: '/api/v1/auth',
        secure: true,
        sameSite: 'none'
      });
    }
    return reply.code(200).send({ message: 'Logged out' });
  });
}
