import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { ConflictError, UnauthorizedError } from '../../src/lib/errors.js';

describe('AuthService', () => {
  let userRepo, redis, jwtSigner, service;

  beforeEach(() => {
    userRepo = { findByEmail: vi.fn(), findById: vi.fn(), create: vi.fn() };
    redis = { get: vi.fn(), set: vi.fn(), del: vi.fn() };
    jwtSigner = { sign: vi.fn().mockReturnValue('signed.jwt.token') };
    service = new AuthService(userRepo, redis, jwtSigner);
  });

  describe('register', () => {
    it('throws ConflictError if email already registered', async () => {
      userRepo.findByEmail.mockResolvedValue({ id: 'existing' });
      await expect(service.register({ email: 'a@vinfast.vn', password: 'Secure123!' })).rejects.toThrow(
        ConflictError
      );
    });

    it('hashes the password before storing', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.create.mockResolvedValue({ id: 'u1', email: 'a@vinfast.vn', role: 'CUSTOMER' });

      await service.register({ email: 'a@vinfast.vn', password: 'Secure123!' });

      const createArg = userRepo.create.mock.calls[0][0];
      expect(createArg.password).not.toBe('Secure123!');
      expect(await bcrypt.compare('Secure123!', createArg.password)).toBe(true);
    });
  });

  describe('login', () => {
    it('throws UnauthorizedError for unknown email', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'ghost@vinfast.vn', password: 'x' })).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('throws UnauthorizedError for wrong password', async () => {
      const hashed = await bcrypt.hash('correct-password', 4);
      userRepo.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@vinfast.vn', password: hashed, role: 'CUSTOMER' });

      await expect(service.login({ email: 'a@vinfast.vn', password: 'wrong-password' })).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('issues a token pair on valid credentials', async () => {
      const hashed = await bcrypt.hash('correct-password', 4);
      userRepo.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@vinfast.vn', password: hashed, role: 'CUSTOMER' });

      const result = await service.login({ email: 'a@vinfast.vn', password: 'correct-password' });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.refreshToken).toBeDefined();
      expect(redis.set).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('throws UnauthorizedError for unknown refresh token', async () => {
      redis.get.mockResolvedValue(null);
      await expect(service.refresh('unknown-token')).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError if user no longer exists in DB', async () => {
      redis.get.mockResolvedValue('u1');
      userRepo.findById.mockResolvedValue(null); // user deleted after token issued
      await expect(service.refresh('some-token')).rejects.toThrow(UnauthorizedError);
    });

    it('rotates the refresh token: deletes old, issues new', async () => {
      redis.get.mockResolvedValue('u1');
      userRepo.findById.mockResolvedValue({ id: 'u1', email: 'a@vinfast.vn', role: 'CUSTOMER' });

      const result = await service.refresh('old-token');

      expect(redis.del).toHaveBeenCalledWith('refresh:old-token');
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.refreshToken).not.toBe('old-token');
    });
  });

  describe('logout', () => {
    it('deletes the refresh token key from Redis', async () => {
      await service.logout('some-refresh-token');
      expect(redis.del).toHaveBeenCalledWith('refresh:some-refresh-token');
    });
  });
});
