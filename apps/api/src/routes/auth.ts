import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import crypto from 'crypto';

// --- MOCK STORES ---
const mockUsers = new Map<string, any>();
const mockRedis = new Map<string, string>();

// Seed a default user for testing without signing up
const DEFAULT_USER_ID = 'test-user-id';
mockUsers.set('test@forexos.com', {
  id: DEFAULT_USER_ID,
  email: 'test@forexos.com',
  passwordHash: 'mocked', // won't be checked strictly in mock
  accountCurrency: 'USD',
  timezone: 'UTC',
});

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

export default async function authRoutes(server: FastifyInstance) {
  server.post('/api/v1/auth/register', { schema: RegisterSchema }, async (request, reply) => {
    const { email, password, accountCurrency, timezone } = request.body as any;
    
    if (mockUsers.has(email)) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Email already exists' });
    }

    const newUser = {
      id: crypto.randomUUID(),
      email,
      passwordHash: 'mocked',
      accountCurrency: accountCurrency || 'USD',
      timezone: timezone || 'UTC',
    };
    
    mockUsers.set(email, newUser);
    return reply.code(201).send({ id: newUser.id, email: newUser.email });
  });

  server.post('/api/v1/auth/login', { schema: LoginSchema }, async (request, reply) => {
    const { email, password } = request.body as any;
    
    // In mock mode, we just let them log in if the user exists, or create on the fly if it doesn't
    let user = mockUsers.get(email);
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        email,
        passwordHash: 'mocked',
        accountCurrency: 'USD',
        timezone: 'UTC',
      };
      mockUsers.set(email, user);
    }

    const accessToken = server.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '15m' });
    
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const REFRESH_TTL = 30 * 24 * 60 * 60; // 30 days
    mockRedis.set(`rt:${refreshToken}`, user.id);
    
    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
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

    const userId = mockRedis.get(`rt:${refreshToken}`);
    if (!userId) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Invalid or expired refresh token' });
    }

    // Find user by id
    let user = Array.from(mockUsers.values()).find(u => u.id === userId);
    if (!user) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'User not found' });
    }

    const newAccessToken = server.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '15m' });

    return reply.code(200).send({ accessToken: newAccessToken });
  });

  server.post('/api/v1/auth/logout', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    if (refreshToken) {
      mockRedis.delete(`rt:${refreshToken}`);
      reply.clearCookie('refreshToken', { path: '/api/v1/auth' });
    }
    return reply.code(200).send({ message: 'Logged out' });
  });
}
