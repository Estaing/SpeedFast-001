import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestInfra, teardownTestInfra } from '../setup.js';

describe('VehicleRepository (integration)', () => {
  let prisma, repo, VehicleRepository;

  beforeAll(async () => {
    await setupTestInfra();
    // Imported after env vars are set so Prisma picks up the test DATABASE_URL
    const { PrismaClient } = await import('@prisma/client');
    ({ VehicleRepository } = await import('../../src/modules/vehicles/vehicle.repository.js'));
    prisma = new PrismaClient();
    repo = new VehicleRepository(prisma);
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
    await teardownTestInfra();
  });

  beforeEach(async () => {
    await prisma.chargeStatus.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();
  });

  it('enforces unique VIN constraint at the database level', async () => {
    const user = await prisma.user.create({ data: { email: 'a@vinfast.vn', password: 'hashed' } });
    await repo.create({ vin: 'VF8X12345678ABCDE', model: 'VF8', batteryCapacity: 87.7, ownerId: user.id });

    await expect(
      repo.create({ vin: 'VF8X12345678ABCDE', model: 'VF8', batteryCapacity: 87.7, ownerId: user.id })
    ).rejects.toThrow();
  });

  it('findByVin returns null for an unregistered VIN', async () => {
    expect(await repo.findByVin('UNKNOWN0000000000')).toBeNull();
  });

  it('cascades delete: removing a vehicle removes its charge status', async () => {
    const user = await prisma.user.create({ data: { email: 'b@vinfast.vn', password: 'hashed' } });
    const vehicle = await repo.create({ vin: 'VF9X98765432ZYXWV', model: 'VF9', batteryCapacity: 92, ownerId: user.id });
    await repo.upsertChargeStatus(vehicle.id, { batteryLevel: 50, isCharging: false, rangeKm: 200 });

    await repo.delete(vehicle.id);

    const orphanedStatus = await prisma.chargeStatus.findUnique({ where: { vehicleId: vehicle.id } });
    expect(orphanedStatus).toBeNull();
  });

  it('paginates findManyByOwner correctly', async () => {
    const user = await prisma.user.create({ data: { email: 'c@vinfast.vn', password: 'hashed' } });
    for (let i = 0; i < 5; i++) {
      await repo.create({
        vin: `VF3X0000000000${i.toString().padStart(3, '0')}`,
        model: 'VF3',
        batteryCapacity: 50,
        ownerId: user.id,
      });
    }

    const page1 = await repo.findManyByOwner(user.id, { page: 1, pageSize: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(5);

    const page3 = await repo.findManyByOwner(user.id, { page: 3, pageSize: 2 });
    expect(page3.items).toHaveLength(1);
  });
});
