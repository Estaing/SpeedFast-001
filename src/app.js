import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';

import authPlugin from './middleware/auth.plugin.js';
import metricsPlugin from './middleware/metrics.plugin.js';
import { errorHandler } from './middleware/error-handler.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { AuthService } from './modules/auth/auth.service.js';
import { UserRepository } from './modules/auth/user.repository.js';

import { vehicleRoutes } from './modules/vehicles/vehicle.routes.js';
import { VehicleService } from './modules/vehicles/vehicle.service.js';
import { VehicleRepository } from './modules/vehicles/vehicle.repository.js';

export function buildApp(opts = {}) {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
      redact: ['req.headers.authorization', 'req.body.password'],
    },
    trustProxy: true,
    ...opts.fastifyOptions,
  });

  // --- Security & infra plugins ---
  app.register(helmet, { contentSecurityPolicy: env.NODE_ENV === 'production' });
  app.register(cors, {
    origin: env.NODE_ENV === 'production' ? ['https://vinfast.vn', 'https://api.vinfast.vn'] : true,
    credentials: true,
  });
  app.register(rateLimit, { max: env.RATE_LIMIT_MAX, timeWindow: env.RATE_LIMIT_WINDOW });
  app.register(jwt, { secret: env.JWT_SECRET });
  app.register(authPlugin);
  app.register(metricsPlugin);

  // --- API docs ---
  app.register(swagger, {
    openapi: {
      info: {
        title: 'VinFast EV Fleet API',
        description: 'Production API for managing VinFast electric vehicles, owners, and charge telemetry.',
        version: '1.0.0',
      },
      servers: [{ url: '/api/v1', description: 'v1' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: [
        { name: 'auth', description: 'Authentication & session management' },
        { name: 'vehicles', description: 'Vehicle fleet & charge telemetry' },
      ],
    },
  });
  app.register(swaggerUi, { routePrefix: '/docs' });

  // --- Dependency injection: wire repositories -> services -> decorate app ---
  const userRepo = new UserRepository(prisma);
  const vehicleRepo = new VehicleRepository(prisma);

  app.decorate('authService', new AuthService(userRepo, redis, app.jwt));
  app.decorate('vehicleService', new VehicleService(vehicleRepo, redis, app.log));

  // --- Health checks (liveness + readiness, standard for k8s/orchestrators) ---
  app.get('/health/live', { schema: { hide: true } }, async () => ({ status: 'ok' }));

  app.get('/health/ready', { schema: { hide: true } }, async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await redis.ping();
      return { status: 'ready' };
    } catch (err) {
      app.log.error({ err }, 'readiness check failed');
      reply.code(503);
      return { status: 'not_ready' };
    }
  });

  // --- Routes ---
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(vehicleRoutes, { prefix: '/api/v1/vehicles' });

  app.setErrorHandler(errorHandler);

  return app;
}
