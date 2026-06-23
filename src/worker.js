import './tracing.js';

import pino from 'pino';
import { Worker } from 'bullmq';
import { env } from './config/env.js';
import { prisma, disconnectPrisma } from './lib/prisma.js';
import { VehicleRepository } from './modules/vehicles/vehicle.repository.js';

const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
});

const connection = { url: env.REDIS_URL };
const vehicleRepo = new VehicleRepository(prisma);

/**
 * Stand-in for a call to VinFast's real telematics gateway / vehicle IoT
 * backend. Swap this for an actual HTTP call to the manufacturer API.
 *
 * @param {string} _vehicleId
 * @returns {{ batteryLevel: number, isCharging: boolean, rangeKm: number }}
 */
async function fetchTelemetryFromGateway(_vehicleId) {
  // Simulated response — replace with real integration.
  return {
    batteryLevel: Math.floor(Math.random() * 100),
    isCharging: Math.random() > 0.5,
    rangeKm: Math.round(Math.random() * 400 * 10) / 10,
  };
}

const worker = new Worker(
  'charge-status-poll',
  async (job) => {
    if (job.name === 'poll') {
      const { vehicleId } = job.data;
      const telemetry = await fetchTelemetryFromGateway(vehicleId);
      await vehicleRepo.upsertChargeStatus(vehicleId, telemetry);
      logger.info({ vehicleId, ...telemetry }, 'telemetry polled');
      return telemetry;
    }

    if (job.name === 'poll-fleet') {
      // TODO: in a real implementation, page through all vehicles and enqueue
      // individual 'poll' jobs rather than processing all serially in one job.
      const vehicles = await prisma.vehicle.findMany({ select: { id: true } });
      for (const v of vehicles) {
        const telemetry = await fetchTelemetryFromGateway(v.id);
        await vehicleRepo.upsertChargeStatus(v.id, telemetry);
      }
      logger.info({ count: vehicles.length }, 'fleet poll completed');
      return { polled: vehicles.length };
    }
  },
  { connection, concurrency: 5 }
);

worker.on('completed', (job) => {
  logger.info({ jobId: job.id, jobName: job.name }, 'job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, jobName: job?.name, err: err.message }, 'job failed');
});

logger.info('charge-status-poll worker started');

async function shutdown(signal) {
  logger.info({ signal }, 'worker shutting down');
  await worker.close();
  await disconnectPrisma();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
