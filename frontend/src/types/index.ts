export type Role = 'CUSTOMER' | 'ADMIN' | 'TECHNICIAN'
export type VehicleModel = 'VF3' | 'VF5' | 'VF6' | 'VF7' | 'VF8' | 'VF9'

export interface User {
  id: string
  email: string
  role: Role
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: User
}

export interface ChargeStatus {
  id: string
  vehicleId: string
  batteryLevel: number
  isCharging: boolean
  rangeKm: number
  updatedAt: string
}

export interface Vehicle {
  id: string
  vin: string
  model: VehicleModel
  batteryCapacity: number
  ownerId: string
  chargeStatus?: ChargeStatus | null
  createdAt: string
  updatedAt: string
}

export interface PaginatedVehicles {
  items: Vehicle[]
  total: number
}

export interface ApiError {
  error: string
  message: string
  details?: Array<{ path: string; message: string }>
}

export interface CreateVehicleInput {
  vin: string
  model: VehicleModel
  batteryCapacity: number
}

export interface UpdateChargeStatusInput {
  batteryLevel: number
  isCharging: boolean
  rangeKm: number
}
