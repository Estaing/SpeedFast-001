// Tracing MUST be the first import — OpenTelemetry needs to patch modules
// before they're required elsewhere, or instrumentation silently no-ops.
import './tracing.js';

import { buildApp } from './app.js';
import { env } from './config/env.js';
import { disconnectPrisma } from './lib/prisma.js';
import { disconnectRedis } from './lib/redis.js';

const app = buildApp();

async function start() {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`VinFast EV API listening on :${env.PORT} (${env.NODE_ENV})`);
    app.log.info(`API docs available at /docs`);
  } catch (err) {
    app.log.error(err, 'failed to start server');
    process.exit(1);
  }
}

async function shutdown(signal) {
  app.log.info(`received ${signal}, shutting down gracefully`);
  try {
    await app.close();
    await disconnectPrisma();
    await disconnectRedis();
    app.log.info('shutdown complete');
    process.exit(0);
  } catch (err) {
    app.log.error(err, 'error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  app.log.error({ reason }, 'unhandled promise rejection');
});

start();
