import { registerHandler, loginHandler, refreshHandler, logoutHandler } from './auth.controller.js';

const userResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['CUSTOMER', 'ADMIN', 'TECHNICIAN'] },
  },
};

const tokenResponseSchema = {
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
    refreshToken: { type: 'string', format: 'uuid' },
    user: userResponseSchema,
  },
};

const errorResponseSchema = {
  type: 'object',
  properties: { error: { type: 'string' }, message: { type: 'string' } },
};

export async function authRoutes(app) {
  app.post('/register', {
    schema: {
      tags: ['auth'],
      summary: 'Create a new account',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, example: 'Secure123!' },
        },
      },
      response: { 201: userResponseSchema, 409: errorResponseSchema },
    },
    handler: registerHandler,
  });

  // Tighter rate limit on login specifically — this is the brute-force
  // target, so it gets a stricter ceiling than the global default.
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    schema: {
      tags: ['auth'],
      summary: 'Authenticate and receive an access/refresh token pair',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: { 200: tokenResponseSchema, 401: errorResponseSchema },
    },
    handler: loginHandler,
  });

  app.post('/refresh', {
    schema: {
      tags: ['auth'],
      summary: 'Exchange a refresh token for a new token pair (rotates the refresh token)',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: { refreshToken: { type: 'string', format: 'uuid' } },
      },
      response: { 200: tokenResponseSchema, 401: errorResponseSchema },
    },
    handler: refreshHandler,
  });

  app.post('/logout', {
    schema: {
      tags: ['auth'],
      summary: 'Revoke a refresh token',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: { refreshToken: { type: 'string', format: 'uuid' } },
      },
      response: { 204: { type: 'null' } },
    },
    handler: logoutHandler,
  });
}
