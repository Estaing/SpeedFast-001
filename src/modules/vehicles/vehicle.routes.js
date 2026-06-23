import {
  createVehicleHandler,
  getVehicleHandler,
  listMyVehiclesHandler,
  updateChargeStatusHandler,
  deleteVehicleHandler,
} from './vehicle.controller.js';

const vehicleResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    vin: { type: 'string' },
    model: { type: 'string', enum: ['VF3', 'VF5', 'VF6', 'VF7', 'VF8', 'VF9'] },
    batteryCapacity: { type: 'number' },
    ownerId: { type: 'string', format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const chargeStatusResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    vehicleId: { type: 'string', format: 'uuid' },
    batteryLevel: { type: 'integer', minimum: 0, maximum: 100 },
    isCharging: { type: 'boolean' },
    rangeKm: { type: 'number' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const errorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
  },
};

export async function vehicleRoutes(app) {
  app.addHook('onRequest', app.authenticate);

  app.post('/', {
    schema: {
      tags: ['vehicles'],
      summary: 'Register a new VinFast vehicle to the authenticated user',
      body: {
        type: 'object',
        required: ['vin', 'model', 'batteryCapacity'],
        properties: {
          vin: { type: 'string', minLength: 17, maxLength: 17, example: 'VF8X12345678ABCDE' },
          model: { type: 'string', enum: ['VF3', 'VF5', 'VF6', 'VF7', 'VF8', 'VF9'] },
          batteryCapacity: { type: 'number', example: 87.7, description: 'kWh' },
        },
      },
      response: {
        201: vehicleResponseSchema,
        400: errorResponseSchema,
        409: errorResponseSchema,
      },
    },
    handler: createVehicleHandler,
  });

  app.get('/', {
    schema: {
      tags: ['vehicles'],
      summary: "List the authenticated user's vehicles (paginated)",
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            items: { type: 'array', items: vehicleResponseSchema },
            total: { type: 'integer' },
          },
        },
      },
    },
    handler: listMyVehiclesHandler,
  });

  app.get('/:id', {
    schema: {
      tags: ['vehicles'],
      summary: 'Get a single vehicle by ID',
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      response: {
        200: vehicleResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: getVehicleHandler,
  });

  app.put('/:id/charge-status', {
    schema: {
      tags: ['vehicles'],
      summary: 'Update telemetry / charging status for a vehicle',
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      body: {
        type: 'object',
        required: ['batteryLevel', 'isCharging', 'rangeKm'],
        properties: {
          batteryLevel: { type: 'integer', minimum: 0, maximum: 100 },
          isCharging: { type: 'boolean' },
          rangeKm: { type: 'number', example: 320.5 },
        },
      },
      response: {
        200: chargeStatusResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: updateChargeStatusHandler,
  });

  app.delete('/:id', {
    schema: {
      tags: ['vehicles'],
      summary: 'Remove a vehicle from the fleet',
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      response: {
        204: { type: 'null' },
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: deleteVehicleHandler,
  });
}
