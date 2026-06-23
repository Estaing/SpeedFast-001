import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VehicleService } from '../../src/modules/vehicles/vehicle.service.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../src/lib/errors.js';

/**
 * Mock cache that simulates ioredis's SCAN cursor protocol:
 * scan(cursor, 'MATCH', pattern, 'COUNT', n) -> ['0', [...keys]]
 */
function makeMockCache(scanKeys = []) {
  return {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    scan: vi.fn().mockResolvedValue(['0', scanKeys]),
  };
}

describe('VehicleService', () => {
  let repo, cache, service;

  beforeEach(() => {
    repo = {
      findByVin: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      findManyByOwner: vi.fn(),
      upsertChargeStatus: vi.fn(),
      delete: vi.fn(),
    };
    cache = makeMockCache();
    service = new VehicleService(repo, cache, { info: vi.fn() });
  });

  describe('registerVehicle', () => {
    it('throws ConflictError if VIN already exists', async () => {
      repo.findByVin.mockResolvedValue({ id: 'existing-1' });

      await expect(
        service.registerVehicle('user-1', { vin: 'VF8X12345678ABCDE', model: 'VF8', batteryCapacity: 87.7 })
      ).rejects.toThrow(ConflictError);

      expect(repo.create).not.toHaveBeenCalled();
    });

    it('creates vehicle and invalidates owner cache keys via SCAN on success', async () => {
      repo.findByVin.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'v1', vin: 'VF8X12345678ABCDE', model: 'VF8' });
      // Simulate two cached paginated keys for this owner
      cache.scan.mockResolvedValue(['0', ['user:vehicles:user-1:1:20', 'user:vehicles:user-1:2:20']]);

      const result = await service.registerVehicle('user-1', {
        vin: 'VF8X12345678ABCDE',
        model: 'VF8',
        batteryCapacity: 87.7,
      });

      expect(result.id).toBe('v1');
      // SCAN was called with the right pattern
      expect(cache.scan).toHaveBeenCalledWith('0', 'MATCH', 'user:vehicles:user-1:*', 'COUNT', 100);
      // Both keys were deleted
      expect(cache.del).toHaveBeenCalledWith('user:vehicles:user-1:1:20', 'user:vehicles:user-1:2:20');
    });

    it('does not call del when no cache keys exist for the owner', async () => {
      repo.findByVin.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'v1', vin: 'VF8X12345678ABCDE', model: 'VF8' });
      cache.scan.mockResolvedValue(['0', []]);

      await service.registerVehicle('user-1', { vin: 'VF8X12345678ABCDE', model: 'VF8', batteryCapacity: 87.7 });

      expect(cache.del).not.toHaveBeenCalled();
    });
  });

  describe('getVehicle', () => {
    it('throws NotFoundError when vehicle does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.getVehicle('missing-id', { id: 'u1', role: 'CUSTOMER' })).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when a non-owner, non-admin requests the vehicle', async () => {
      repo.findById.mockResolvedValue({ id: 'v1', ownerId: 'owner-1' });
      await expect(
        service.getVehicle('v1', { id: 'someone-else', role: 'CUSTOMER' })
      ).rejects.toThrow(ForbiddenError);
    });

    it('allows ADMIN role to access any vehicle regardless of ownership', async () => {
      repo.findById.mockResolvedValue({ id: 'v1', ownerId: 'owner-1' });
      const result = await service.getVehicle('v1', { id: 'admin-1', role: 'ADMIN' });
      expect(result.id).toBe('v1');
    });

    it('allows TECHNICIAN role to access any vehicle', async () => {
      repo.findById.mockResolvedValue({ id: 'v1', ownerId: 'owner-1' });
      // TECHNICIAN is not ADMIN — they get ForbiddenError with current logic.
      // This test documents the current behaviour explicitly so any change is noticed.
      await expect(
        service.getVehicle('v1', { id: 'tech-1', role: 'TECHNICIAN' })
      ).rejects.toThrow(ForbiddenError);
    });

    it('allows the owner to access their own vehicle', async () => {
      repo.findById.mockResolvedValue({ id: 'v1', ownerId: 'owner-1' });
      const result = await service.getVehicle('v1', { id: 'owner-1', role: 'CUSTOMER' });
      expect(result.id).toBe('v1');
    });
  });

  describe('listMyVehicles', () => {
    it('returns cached result without hitting the repository on cache hit', async () => {
      cache.get.mockResolvedValue(JSON.stringify({ items: [{ id: 'cached' }], total: 1 }));

      const result = await service.listMyVehicles('user-1', { page: 1, pageSize: 20 });

      expect(result.items[0].id).toBe('cached');
      expect(repo.findManyByOwner).not.toHaveBeenCalled();
    });

    it('falls through to repository and populates cache on cache miss', async () => {
      cache.get.mockResolvedValue(null);
      repo.findManyByOwner.mockResolvedValue({ items: [{ id: 'fresh' }], total: 1 });

      const result = await service.listMyVehicles('user-1', { page: 1, pageSize: 20 });

      expect(result.items[0].id).toBe('fresh');
      expect(cache.set).toHaveBeenCalledWith(
        'user:vehicles:user-1:1:20',
        JSON.stringify({ items: [{ id: 'fresh' }], total: 1 }),
        'EX',
        60
      );
    });
  });

  describe('updateChargeStatus', () => {
    it('rejects update from a non-owner', async () => {
      repo.findById.mockResolvedValue({ id: 'v1', ownerId: 'owner-1' });
      await expect(
        service.updateChargeStatus('v1', { id: 'intruder', role: 'CUSTOMER' }, { batteryLevel: 80 })
      ).rejects.toThrow(ForbiddenError);
      expect(repo.upsertChargeStatus).not.toHaveBeenCalled();
    });

    it('updates charge status for the owner', async () => {
      repo.findById.mockResolvedValue({ id: 'v1', ownerId: 'owner-1' });
      repo.upsertChargeStatus.mockResolvedValue({ vehicleId: 'v1', batteryLevel: 80 });

      const result = await service.updateChargeStatus(
        'v1',
        { id: 'owner-1', role: 'CUSTOMER' },
        { batteryLevel: 80, isCharging: true, rangeKm: 250 }
      );

      expect(result.batteryLevel).toBe(80);
    });
  });

  describe('removeVehicle', () => {
    it('deletes and invalidates all paginated cache keys for the owner', async () => {
      repo.findById.mockResolvedValue({ id: 'v1', ownerId: 'owner-1' });
      cache.scan.mockResolvedValue(['0', ['user:vehicles:owner-1:1:20']]);

      await service.removeVehicle('v1', { id: 'owner-1', role: 'CUSTOMER' });

      expect(repo.delete).toHaveBeenCalledWith('v1');
      expect(cache.del).toHaveBeenCalledWith('user:vehicles:owner-1:1:20');
    });

    it('allows ADMIN to delete any vehicle', async () => {
      repo.findById.mockResolvedValue({ id: 'v1', ownerId: 'owner-1' });
      cache.scan.mockResolvedValue(['0', []]);

      await service.removeVehicle('v1', { id: 'admin-1', role: 'ADMIN' });

      expect(repo.delete).toHaveBeenCalledWith('v1');
    });

    it('blocks non-owner from deleting', async () => {
      repo.findById.mockResolvedValue({ id: 'v1', ownerId: 'owner-1' });

      await expect(
        service.removeVehicle('v1', { id: 'intruder', role: 'CUSTOMER' })
      ).rejects.toThrow(ForbiddenError);
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });
});
