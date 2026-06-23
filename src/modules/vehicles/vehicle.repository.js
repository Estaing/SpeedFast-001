export class VehicleRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  findByVin(vin) {
    return this.prisma.vehicle.findUnique({ where: { vin } });
  }

  findById(id) {
    return this.prisma.vehicle.findUnique({
      where: { id },
      include: { chargeStatus: true },
    });
  }

  create(data) {
    return this.prisma.vehicle.create({ data });
  }

  async findManyByOwner(ownerId, { page, pageSize }) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.vehicle.findMany({
        where: { ownerId },
        include: { chargeStatus: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vehicle.count({ where: { ownerId } }),
    ]);
    return { items, total };
  }

  upsertChargeStatus(vehicleId, data) {
    return this.prisma.chargeStatus.upsert({
      where: { vehicleId },
      update: data,
      create: { vehicleId, ...data },
    });
  }

  delete(id) {
    return this.prisma.vehicle.delete({ where: { id } });
  }
}
