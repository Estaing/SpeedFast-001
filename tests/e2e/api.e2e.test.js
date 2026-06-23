import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestInfra, teardownTestInfra } from '../setup.js';

describe('VinFast EV API (e2e)', () => {
  let app, buildApp;
  let accessToken, refreshToken;

  beforeAll(async () => {
    await setupTestInfra();
    ({ buildApp } = await import('../../src/app.js'));
    app = buildApp();
    await app.ready();
  }, 60000);

  afterAll(async () => {
    await app.close();
    await teardownTestInfra();
  });

  describe('Auth flow', () => {
    it('registers a new user', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'e2e@vinfast.vn', password: 'Secure123!' },
      });
      expect(res.statusCode).toBe(201);
      expect(JSON.parse(res.payload).email).toBe('e2e@vinfast.vn');
    });

    it('rejects duplicate registration', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'e2e@vinfast.vn', password: 'Secure123!' },
      });
      expect(res.statusCode).toBe(409);
    });

    it('rejects weak passwords on registration', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'weak@vinfast.vn', password: 'weak' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('logs in and receives a token pair', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'e2e@vinfast.vn', password: 'Secure123!' },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      accessToken = body.accessToken;
      refreshToken = body.refreshToken;
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
    });

    it('rejects login with wrong password', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'e2e@vinfast.vn', password: 'WrongPassword1' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('rotates tokens on refresh', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: { refreshToken },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.refreshToken).not.toBe(refreshToken);
      refreshToken = body.refreshToken;
      accessToken = body.accessToken;
    });
  });

  describe('Vehicle flow', () => {
    let vehicleId;

    it('rejects vehicle creation without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/vehicles',
        payload: { vin: 'VF8X12345678ABCDE', model: 'VF8', batteryCapacity: 87.7 },
      });
      expect(res.statusCode).toBe(401);
    });

    it('creates a vehicle for the authenticated user', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/vehicles',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { vin: 'VF8X12345678ABCDE', model: 'VF8', batteryCapacity: 87.7 },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.vin).toBe('VF8X12345678ABCDE');
      vehicleId = body.id;
    });

    it('rejects malformed VIN with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/vehicles',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { vin: 'TOO_SHORT', model: 'VF8', batteryCapacity: 87.7 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects duplicate VIN with 409', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/vehicles',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { vin: 'VF8X12345678ABCDE', model: 'VF8', batteryCapacity: 87.7 },
      });
      expect(res.statusCode).toBe(409);
    });

    it('fetches the created vehicle by id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/vehicles/${vehicleId}`,
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).id).toBe(vehicleId);
    });

    it('updates charge status telemetry', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/vehicles/${vehicleId}/charge-status`,
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { batteryLevel: 72, isCharging: true, rangeKm: 280.4 },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).batteryLevel).toBe(72);
    });

    it('lists the owner vehicles with pagination envelope', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/vehicles?page=1&pageSize=10',
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.items.length).toBeGreaterThan(0);
      expect(body.total).toBeGreaterThan(0);
    });

    it('returns 404 for a vehicle that does not exist', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/vehicles/00000000-0000-0000-0000-000000000000',
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(res.statusCode).toBe(404);
    });

    it('deletes the vehicle', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/vehicles/${vehicleId}`,
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(res.statusCode).toBe(204);
    });
  });

  describe('Health & docs', () => {
    it('liveness check returns ok', async () => {
      const res = await app.inject({ method: 'GET', url: '/health/live' });
      expect(res.statusCode).toBe(200);
    });

    it('readiness check returns ready when DB/Redis are reachable', async () => {
      const res = await app.inject({ method: 'GET', url: '/health/ready' });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).status).toBe('ready');
    });

    it('serves OpenAPI docs UI', async () => {
      const res = await app.inject({ method: 'GET', url: '/docs' });
      expect(res.statusCode).toBe(302); // redirects to /docs/static/index.html
    });
  });
});
