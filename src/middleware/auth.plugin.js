import fp from 'fastify-plugin';
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js';

async function authPlugin(app) {
  app.decorate('authenticate', async (req) => {
    try {
      await req.jwtVerify();
    } catch {
      throw new UnauthorizedError('Missing or invalid access token');
    }
  });

  // requireRole: authenticate first, then check role.
  // Throws ForbiddenError (403) — not UnauthorizedError (401) —
  // for a valid token that lacks the required role. 401 means
  // "who are you?"; 403 means "I know who you are, but no."
  app.decorate('requireRole', (...allowedRoles) => {
    return async (req) => {
      try {
        await req.jwtVerify();
      } catch {
        throw new UnauthorizedError('Missing or invalid access token');
      }
      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError(`Requires one of roles: ${allowedRoles.join(', ')}`);
      }
    };
  });
}

export default fp(authPlugin);
