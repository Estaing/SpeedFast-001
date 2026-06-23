import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors.js';
import { vehicleRegistrations } from '../../lib/metrics.js';

const OWNER_VEHICLES_CACHE_PREFIX = 'user:vehicles:';
const CACHE_TTL_SECONDS = 60;

export class VehicleService {
  constructor(repo, cache, logger) {
    this.repo = repo;
    this.cache = cache;
    this.logger = logger;
  }

  /**
   * Invalidate ALL paginated cache keys for an owner using SCAN.
   * Cache stores keys like user:vehicles:{ownerId}:{page}:{pageSize},
   * so a plain del on a prefix-only key would silently miss them all.
   * SCAN is safe in production; KEYS is not (it blocks the event loop).
   */
  async _invalidateOwnerCache(ownerId) {
    const pattern = `${OWNER_VEHICLES_CACHE_PREFIX}${ownerId}:*`;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.cache.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await this.cache.del(...keys);
      }
    } while (cursor !== '0');
  }

  async registerVehicle(ownerId, input) {
    const existing = await this.repo.findByVin(input.vin);
    if (existing) {
      throw new ConflictError(`Vehicle with VIN ${input.vin} is already registered`);
    }

    const vehicle = await this.repo.create({ ...input, ownerId });
    await this._invalidateOwnerCache(ownerId);
    vehicleRegistrations.inc({ model: input.model });

    this.logger?.info({ vehicleId: vehicle.id, vin: vehicle.vin }, 'vehicle registered');
    return vehicle;
  }

  async getVehicle(vehicleId, requestingUser) {
    const vehicle = await this.repo.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    if (requestingUser.role !== 'ADMIN' && vehicle.ownerId !== requestingUser.id) {
      throw new ForbiddenError('You do not have access to this vehicle');
    }
    return vehicle;
  }

  async listMyVehicles(ownerId, pagination) {
    const cacheKey = `${OWNER_VEHICLES_CACHE_PREFIX}${ownerId}:${pagination.page}:${pagination.pageSize}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await this.repo.findManyByOwner(ownerId, pagination);
    await this.cache.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL_SECONDS);
    return result;
  }

  async updateChargeStatus(vehicleId, requestingUser, statusInput) {
    // Ownership/role check reuses getVehicle so the rule lives in one place.
    await this.getVehicle(vehicleId, requestingUser);
    const status = await this.repo.upsertChargeStatus(vehicleId, statusInput);
    this.logger?.info({ vehicleId, batteryLevel: statusInput.batteryLevel }, 'charge status updated');
    return status;
  }

  async removeVehicle(vehicleId, requestingUser) {
    const vehicle = await this.getVehicle(vehicleId, requestingUser);
    await this.repo.delete(vehicle.id);
    await this._invalidateOwnerCache(requestingUser.id);
  }
}
