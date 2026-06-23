import Redis from 'ioredis';
import { env } from '../config/env.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 2000),
  // enableReadyCheck ensures we don't attempt commands before Redis
  // has finished loading (e.g. after an AOF/RDB restore on restart).
  enableReadyCheck: true,
  // lazyConnect: true lets the constructor return immediately; the
  // connection is established on the first command, not on import.
  // This prevents boot-time crashes if Redis is momentarily unavailable
  // during a rolling deployment while the app is still starting.
  lazyConnect: true,
});

redis.on('error', (err) => {
  // Log but don't crash — Redis unavailability should degrade gracefully
  // (cache misses fall through to DB; token ops will throw and be caught).
  console.error('[redis] connection error:', err.message);
});

export async function disconnectRedis() {
  await redis.quit();
}
