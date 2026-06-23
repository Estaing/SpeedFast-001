import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';

export function errorHandler(error, req, reply) {
  // Zod validation errors -> 400 with field-level detail
  if (error instanceof ZodError) {
    req.log.warn({ issues: error.issues }, 'validation failed');
    return reply.code(400).send({
      error: 'ValidationError',
      message: 'Request validation failed',
      details: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  // Known, intentional application errors -> their declared status code
  if (error instanceof AppError) {
    req.log.warn({ err: error }, error.message);
    return reply.code(error.statusCode).send({
      error: error.name,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
  }

  // Prisma unique constraint violation, in case it slips past service-level checks
  if (error.code === 'P2002') {
    req.log.warn({ err: error }, 'unique constraint violation');
    return reply.code(409).send({ error: 'ConflictError', message: 'Resource already exists' });
  }

  // Fastify's own validation/rate-limit errors carry a statusCode already
  if (error.statusCode && error.statusCode < 500) {
    return reply.code(error.statusCode).send({ error: error.name || 'Error', message: error.message });
  }

  // Anything else: unknown failure — log full detail server-side,
  // never leak internals (stack traces, SQL, file paths) to the client.
  req.log.error({ err: error }, 'unhandled error');
  reply.code(500).send({ error: 'InternalServerError', message: 'Something went wrong' });
}
