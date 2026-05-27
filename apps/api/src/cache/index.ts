import Redis from 'ioredis';

// Use a real Redis client if REDIS_URL is provided, else fallback to a simple in-memory mock for local dev without Redis
const redisUrl = process.env.REDIS_URL;

class MockRedis {
  private store = new Map<string, string>();
  
  async get(key: string) {
    return this.store.get(key) || null;
  }
  
  async set(key: string, value: string, mode?: string, duration?: number) {
    this.store.set(key, value);
    if (mode === 'EX' && duration) {
      setTimeout(() => this.store.delete(key), duration * 1000);
    }
    return 'OK';
  }
  
  async del(key: string) {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }
  
  on(event: string, callback: any) {}
}

export const redis = redisUrl ? new Redis(redisUrl) : new MockRedis();
