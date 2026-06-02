"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
// Use a real Redis client if REDIS_URL is provided, else fallback to a simple in-memory mock for local dev without Redis
const redisUrl = process.env.REDIS_URL;
class MockRedis {
    store = new Map();
    async get(key) {
        return this.store.get(key) || null;
    }
    async set(key, value, mode, duration) {
        this.store.set(key, value);
        if (mode === 'EX' && duration) {
            setTimeout(() => this.store.delete(key), duration * 1000);
        }
        return 'OK';
    }
    async del(key) {
        const existed = this.store.has(key);
        this.store.delete(key);
        return existed ? 1 : 0;
    }
    on(event, callback) { }
}
exports.redis = redisUrl ? new ioredis_1.default(redisUrl) : new MockRedis();
