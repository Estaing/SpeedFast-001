import {
  createVehicleSchema,
  vehicleIdParamSchema,
  updateChargeStatusSchema,
  listVehiclesQuerySchema,
} from './vehicle.schema.js';

export async function createVehicleHandler(req, reply) {
  const input = createVehicleSchema.parse(req.body);
  const vehicle = await req.server.vehicleService.registerVehicle(req.user.id, input);
  reply.code(201).send(vehicle);
}

export async function getVehicleHandler(req, reply) {
  const { id } = vehicleIdParamSchema.parse(req.params);
  const vehicle = await req.server.vehicleService.getVehicle(id, req.user);
  reply.send(vehicle);
}

export async function listMyVehiclesHandler(req, reply) {
  const pagination = listVehiclesQuerySchema.parse(req.query);
  const result = await req.server.vehicleService.listMyVehicles(req.user.id, pagination);
  reply.send(result);
}

export async function updateChargeStatusHandler(req, reply) {
  const { id } = vehicleIdParamSchema.parse(req.params);
  const input = updateChargeStatusSchema.parse(req.body);
  const status = await req.server.vehicleService.updateChargeStatus(id, req.user, input);
  reply.send(status);
}

export async function deleteVehicleHandler(req, reply) {
  const { id } = vehicleIdParamSchema.parse(req.params);
  await req.server.vehicleService.removeVehicle(id, req.user);
  reply.code(204).send();
}
