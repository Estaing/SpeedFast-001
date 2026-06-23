import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useCreateVehicle } from '@/hooks/useVehicles'
import { toast } from '@/components/ui/Toast'
import styles from './AddVehicleForm.module.css'

const schema = z.object({
  vin: z.string().length(17, 'VIN must be exactly 17 characters'),
  model: z.enum(['VF3','VF5','VF6','VF7','VF8','VF9']),
  batteryCapacity: z.coerce.number().positive('Must be positive').max(200, 'Max 200 kWh'),
})
type FormData = z.infer<typeof schema>

const MODEL_OPTIONS = ['VF3','VF5','VF6','VF7','VF8','VF9'].map(m => ({ value: m, label: `VinFast ${m}` }))

interface Props { onSuccess: () => void; onCancel: () => void }

export function AddVehicleForm({ onSuccess, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  const { mutateAsync, isPending } = useCreateVehicle()

  const onSubmit = async (data: FormData) => {
    try {
      await mutateAsync(data)
      toast.success(`${data.model} registered successfully`)
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to register vehicle'
      toast.error(msg)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
      <Input label="VIN" placeholder="VF8X12345678ABCDE" error={errors.vin?.message}
        hint="17-character Vehicle Identification Number" {...register('vin')} />
      <Select label="Model" options={MODEL_OPTIONS} error={errors.model?.message} {...register('model')} />
      <Input label="Battery Capacity (kWh)" type="number" step="0.1" placeholder="87.7"
        error={errors.batteryCapacity?.message} {...register('batteryCapacity')} />
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isPending}>Register Vehicle</Button>
      </div>
    </form>
  )
}
