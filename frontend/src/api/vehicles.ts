import { apiClient } from './client'
import type { Vehicle, PaginatedVehicles, ChargeStatus, CreateVehicleInput, UpdateChargeStatusInput } from '@/types'

export const vehiclesApi = {
  list: (page = 1, pageSize = 20): Promise<PaginatedVehicles> =>
    apiClient.get('/api/v1/vehicles', { params: { page, pageSize } }).then((r) => r.data),

  get: (id: string): Promise<Vehicle> =>
    apiClient.get(`/api/v1/vehicles/${id}`).then((r) => r.data),

  create: (input: CreateVehicleInput): Promise<Vehicle> =>
    apiClient.post('/api/v1/vehicles', input).then((r) => r.data),

  updateChargeStatus: (id: string, input: UpdateChargeStatusInput): Promise<ChargeStatus> =>
    apiClient.put(`/api/v1/vehicles/${id}/charge-status`, input).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/api/v1/vehicles/${id}`).then(() => undefined),
}
