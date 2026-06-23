import { Queue } from 'bullmq';
import { env } from '../config/env.js';

// BullMQ wants its own dedicated connection options, not a shared ioredis
// instance with custom retry strategies — keeping it separate avoids
// subtle queue-stalling bugs from connection-level interference.
const connection = { url: env.REDIS_URL };

export const chargeStatusQueue = new Queue('charge-status-poll', { connection });

/**
 * Enqueue a one-off poll for a single vehicle's live telemetry.
 * Used right after a vehicle is registered, or on-demand from a "refresh" button.
 */
export function enqueueChargeStatusPoll(vehicleId) {
  return chargeStatusQueue.add(
    'poll',
    { vehicleId },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 },
    }
  );
}

/**
 * Schedule recurring polling for all active vehicles, e.g. every 5 minutes.
 * Call once at startup (idempotent — BullMQ dedupes repeatable jobs by key).
 */
export function scheduleRecurringFleetPoll() {
  return chargeStatusQueue.add(
    'poll-fleet',
    {},
    { repeat: { every: 5 * 60 * 1000 }, jobId: 'fleet-poll-recurring' }
  );
}
