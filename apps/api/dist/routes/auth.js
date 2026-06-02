"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const typebox_1 = require("@sinclair/typebox");
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const cache_1 = require("../cache");
const RegisterSchema = {
    body: typebox_1.Type.Object({
        email: typebox_1.Type.String({ format: 'email' }),
        password: typebox_1.Type.String({ minLength: 8 }),
        accountCurrency: typebox_1.Type.Optional(typebox_1.Type.String({ minLength: 3, maxLength: 3 })),
        timezone: typebox_1.Type.Optional(typebox_1.Type.String()),
    }),
    response: {
        201: typebox_1.Type.Object({
            id: typebox_1.Type.String(),
            email: typebox_1.Type.String(),
        }),
        400: typebox_1.Type.Object({
            error: typebox_1.Type.String(),
            message: typebox_1.Type.String(),
        }),
    },
};
const LoginSchema = {
    body: typebox_1.Type.Object({
        email: typebox_1.Type.String({ format: 'email' }),
        password: typebox_1.Type.String(),
    }),
    response: {
        200: typebox_1.Type.Object({
            accessToken: typebox_1.Type.String(),
            user: typebox_1.Type.Object({
                id: typebox_1.Type.String(),
                email: typebox_1.Type.String(),
            }),
        }),
        401: typebox_1.Type.Object({
            error: typebox_1.Type.String(),
            message: typebox_1.Type.String(),
        }),
    },
};
const ChangePasswordSchema = {
    body: typebox_1.Type.Object({
        oldPassword: typebox_1.Type.String(),
        newPassword: typebox_1.Type.String({ minLength: 8 }),
    }),
    response: {
        200: typebox_1.Type.Object({
            message: typebox_1.Type.String(),
        }),
        400: typebox_1.Type.Object({
            error: typebox_1.Type.String(),
            message: typebox_1.Type.String(),
        }),
        401: typebox_1.Type.Object({
            error: typebox_1.Type.String(),
            message: typebox_1.Type.String(),
        }),
    },
};
async function authRoutes(server) {
    server.post('/api/v1/auth/register', { schema: RegisterSchema }, async (request, reply) => {
        const { email, password, accountCurrency, timezone } = request.body;
        // Check global user cap (strictly 10 users for free tier efficiency)
        const [userCountResult] = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)::int` }).from(schema_1.users);
        if (userCountResult.count >= 10) {
            return reply.code(400).send({ error: 'CAP_REACHED', message: 'Registration cap reached! This terminal is strictly limited to 10 users for free hosting efficiency.' });
        }
        // Check if email already exists
        const [existingUser] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (existingUser) {
            return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Email already exists' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const [newUser] = await db_1.db.insert(schema_1.users).values({
            email,
            passwordHash,
            accountCurrency: accountCurrency || 'USD',
            timezone: timezone || 'UTC',
        }).returning({ id: schema_1.users.id, email: schema_1.users.email });
        return reply.code(201).send({ id: newUser.id, email: newUser.email });
    });
    server.post('/api/v1/auth/login', { schema: LoginSchema }, async (request, reply) => {
        const { email, password } = request.body;
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (!user) {
            return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Invalid credentials' });
        }
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Invalid credentials' });
        }
        const accessToken = server.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '15m' });
        const refreshToken = crypto_1.default.randomBytes(40).toString('hex');
        const REFRESH_TTL = 30 * 24 * 60 * 60; // 30 days
        await cache_1.redis.set(`rt:${refreshToken}`, user.id, 'EX', REFRESH_TTL);
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
        const userId = await cache_1.redis.get(`rt:${refreshToken}`);
        if (!userId) {
            return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Invalid or expired refresh token' });
        }
        // Verify user still exists
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        if (!user) {
            return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'User not found' });
        }
        const newAccessToken = server.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '15m' });
        return reply.code(200).send({ accessToken: newAccessToken });
    });
    server.post('/api/v1/auth/change-password', { schema: ChangePasswordSchema, onRequest: [server.authenticate] }, async (request, reply) => {
        const { oldPassword, newPassword } = request.body;
        const userPayload = request.user; // attached by fastify-jwt
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userPayload.sub));
        if (!user) {
            return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'User not found' });
        }
        const isValid = await bcryptjs_1.default.compare(oldPassword, user.passwordHash);
        if (!isValid) {
            return reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'Incorrect old password' });
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        await db_1.db.update(schema_1.users).set({ passwordHash }).where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
        return reply.code(200).send({ message: 'Password updated successfully' });
    });
    server.post('/api/v1/auth/logout', async (request, reply) => {
        const refreshToken = request.cookies.refreshToken;
        if (refreshToken) {
            await cache_1.redis.del(`rt:${refreshToken}`);
            reply.clearCookie('refreshToken', { path: '/api/v1/auth' });
        }
        return reply.code(200).send({ message: 'Logged out' });
    });
}
