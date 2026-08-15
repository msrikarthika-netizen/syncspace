import { REDIS_URL } from './serverConfig.js';
import Redis from 'ioredis';

export const redisOptions = {
  connection: {
    url: REDIS_URL,
  },
};

export const redisConfig = {
  url: REDIS_URL,
};

/**
 * Opens a short-lived connection for administrative readiness checks.
 * The main application does not yet use Redis as a queue/cache, so a probe is
 * intentionally isolated from future long-lived worker/cache clients.
 */
export async function checkRedisHealth() {
  const client = new Redis(REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 2000,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy: () => null,
  });
  // ioredis emits connection errors even when callers catch connect()/ping().
  // Registering this listener prevents an unhandled EventEmitter error.
  client.on('error', () => {});

  try {
    await client.connect();
    const response = await client.ping();
    if (response !== 'PONG') throw new Error(`Unexpected Redis response: ${response}`);
    return { status: 'healthy', detail: 'Redis PING succeeded' };
  } catch {
    return { status: 'unhealthy', detail: 'Redis PING failed or timed out' };
  } finally {
    client.disconnect();
  }
}
