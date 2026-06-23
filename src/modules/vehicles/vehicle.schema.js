import { z } from 'zod';

export const vehicleModelEnum = z.enum(['VF3', 'VF5', 'VF6', 'VF7', 'VF8', 'VF9']);

export const createVehicleSchema = z.object({
  vin: z.string().length(17, 'VIN must be exactly 17 characters'),
  model: vehicleModelEnum,
  batteryCapacity: z.number().positive().max(200),
});

export const vehicleIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const updateChargeStatusSchema = z.object({
  batteryLevel: z.number().int().min(0).max(100),
  isCharging: z.boolean(),
  rangeKm: z.number().min(0),
});

export const listVehiclesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
