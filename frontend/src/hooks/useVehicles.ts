import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehiclesApi } from '@/api/vehicles'
import type { CreateVehicleInput, UpdateChargeStatusInput } from '@/types'

export const VEHICLES_KEY = ['vehicles'] as const

export function useVehicles(page = 1, pageSize = 12) {
  return useQuery({
    queryKey: [...VEHICLES_KEY, page, pageSize],
    queryFn: () => vehiclesApi.list(page, pageSize),
    staleTime: 30_000,
  })
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: [...VEHICLES_KEY, id],
    queryFn: () => vehiclesApi.get(id),
    enabled: !!id,
    staleTime: 20_000,
  })
}

export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateVehicleInput) => vehiclesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: VEHICLES_KEY }),
  })
}

export function useUpdateChargeStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateChargeStatusInput }) =>
      vehiclesApi.updateChargeStatus(id, input),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [...VEHICLES_KEY, id] })
      qc.invalidateQueries({ queryKey: VEHICLES_KEY })
    },
  })
}

export function useDeleteVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => vehiclesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: VEHICLES_KEY }),
  })
}
