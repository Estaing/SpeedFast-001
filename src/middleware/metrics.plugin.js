import fp from 'fastify-plugin';
import { httpRequestDuration, httpRequestsTotal, metricsRegistry } from '../lib/metrics.js';

async function metricsPlugin(app) {
  app.addHook('onRequest', async (req) => {
    req.startTime = process.hrtime.bigint();
  });

  app.addHook('onResponse', async (req, reply) => {
    const route = req.routeOptions?.url || req.url;
    const durationNs = process.hrtime.bigint() - (req.startTime ?? process.hrtime.bigint());
    const durationSeconds = Number(durationNs) / 1e9;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: reply.statusCode },
      durationSeconds
    );
    httpRequestsTotal.inc({ method: req.method, route, status_code: reply.statusCode });
  });

  app.get('/metrics', { schema: { hide: true } }, async (_req, reply) => {
    reply.header('Content-Type', metricsRegistry.contentType);
    return metricsRegistry.metrics();
  });
}

export default fp(metricsPlugin);
