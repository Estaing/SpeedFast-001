import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Trash2, RefreshCw, Zap, Navigation, Clock, Activity } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { BatteryArc } from '@/components/vehicles/BatteryArc'
import { useVehicle, useUpdateChargeStatus, useDeleteVehicle } from '@/hooks/useVehicles'
import { toast } from '@/components/ui/Toast'
import styles from './VehicleDetailPage.module.css'

const chargeSchema = z.object({
  batteryLevel: z.coerce.number().int().min(0).max(100),
  isCharging:   z.boolean(),
  rangeKm:      z.coerce.number().min(0),
})
type ChargeForm = z.infer<typeof chargeSchema>

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: vehicle, isLoading, error, refetch } = useVehicle(id!)
  const { mutateAsync: updateCharge, isPending: updatingCharge } = useUpdateChargeStatus()
  const { mutateAsync: deleteVehicle, isPending: deleting } = useDeleteVehicle()
  const [editCharge, setEditCharge] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ChargeForm>({
    resolver: zodResolver(chargeSchema),
    defaultValues: {
      batteryLevel: vehicle?.chargeStatus?.batteryLevel ?? 0,
      isCharging:   vehicle?.chargeStatus?.isCharging ?? false,
      rangeKm:      vehicle?.chargeStatus?.rangeKm ?? 0,
    },
  })

  const onChargeSubmit = async (data: ChargeForm) => {
    try {
      await updateCharge({ id: id!, input: data })
      toast.success('Telemetry updated')
      setEditCharge(false)
    } catch {
      toast.error('Failed to update telemetry')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteVehicle(id!)
      toast.success('Vehicle removed from fleet')
      navigate('/vehicles')
    } catch {
      toast.error('Failed to delete vehicle')
    }
  }

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={`skeleton ${styles.skH}`} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:20 }}>
          <div className={`skeleton ${styles.skCard}`} />
          <div className={`skeleton ${styles.skCard}`} />
        </div>
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className={styles.root}>
        <Link to="/vehicles" className={styles.back}><ArrowLeft size={16}/> Back to fleet</Link>
        <Card className={styles.errorState}><p style={{color:'var(--red)'}}>Vehicle not found.</p></Card>
      </div>
    )
  }

  const cs = vehicle.chargeStatus
  const batLevel = cs?.batteryLevel ?? 0

  return (
    <div className={styles.root}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link to="/vehicles" className={styles.back}><ArrowLeft size={16}/> Fleet</Link>
        <span className={styles.breadSep}>/</span>
        <span className={styles.breadCurrent}>{vehicle.model} · {vehicle.vin.slice(-6)}</span>
      </div>

      {/* Page title + actions */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>VinFast {vehicle.model}</h1>
          <code className={styles.vin}>{vehicle.vin}</code>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={() => refetch()}><RefreshCw size={14}/>Refresh</Button>
          <Button variant="secondary" size="sm" onClick={() => setEditCharge(true)}><Activity size={14}/>Update Telemetry</Button>
          <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}><Trash2 size={14}/>Remove</Button>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Battery panel — the signature element */}
        <Card glow className={styles.batteryCard}>
          <h2 className={styles.cardTitle}>Battery Status</h2>
          <div className={styles.arcCenter}>
            <BatteryArc level={batLevel} isCharging={cs?.isCharging ?? false} size={160} />
          </div>
          <div className={styles.batteryStats}>
            <div className={styles.bStat}>
              <Zap size={15} color="var(--orange-400)" />
              <span className={styles.bVal}>{vehicle.batteryCapacity} kWh</span>
              <span className={styles.bLabel}>Capacity</span>
            </div>
            <div className={styles.bStat}>
              <Navigation size={15} color="var(--orange-400)" />
              <span className={styles.bVal}>{cs?.rangeKm?.toFixed(0) ?? '—'} km</span>
              <span className={styles.bLabel}>Est. Range</span>
            </div>
          </div>
          <div style={{ textAlign:'center', marginTop:12 }}>
            {cs?.isCharging
              ? <Badge variant="success">⚡ Charging</Badge>
              : <Badge variant="info">Idle</Badge>
            }
          </div>
        </Card>

        {/* Vehicle info */}
        <div className={styles.infoCol}>
          <Card className={styles.infoCard}>
            <h2 className={styles.cardTitle}>Vehicle Info</h2>
            <dl className={styles.dl}>
              {[
                ['Model',         `VinFast ${vehicle.model}`],
                ['VIN',           vehicle.vin],
                ['Battery',       `${vehicle.batteryCapacity} kWh`],
                ['Registered',    new Date(vehicle.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })],
                ['Last updated',  new Date(vehicle.updatedAt).toLocaleString()],
              ].map(([k,v]) => (
                <div key={k} className={styles.row}>
                  <dt className={styles.dt}>{k}</dt>
                  <dd className={styles.dd}>{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {cs && (
            <Card className={styles.infoCard}>
              <div className={styles.cardTitleRow}>
                <h2 className={styles.cardTitle}>Latest Telemetry</h2>
                <div className={styles.telTime}><Clock size={12}/>{new Date(cs.updatedAt).toLocaleTimeString()}</div>
              </div>
              <dl className={styles.dl}>
                {[
                  ['Battery level', `${cs.batteryLevel}%`],
                  ['Charging',      cs.isCharging ? 'Yes' : 'No'],
                  ['Range',         `${cs.rangeKm.toFixed(1)} km`],
                ].map(([k,v]) => (
                  <div key={k} className={styles.row}>
                    <dt className={styles.dt}>{k}</dt>
                    <dd className={styles.dd}>{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
        </div>
      </div>

      {/* Update telemetry modal */}
      <Modal open={editCharge} onClose={() => setEditCharge(false)} title="Update Telemetry">
        <form onSubmit={handleSubmit(onChargeSubmit)} className={styles.chargeForm}>
          <Input label="Battery Level (0–100)" type="number" min={0} max={100}
            error={errors.batteryLevel?.message} {...register('batteryLevel')} />
          <Input label="Range (km)" type="number" step="0.1"
            error={errors.rangeKm?.message} {...register('rangeKm')} />
          <label className={styles.checkLabel}>
            <input type="checkbox" {...register('isCharging')} className={styles.checkbox} />
            Currently charging
          </label>
          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => setEditCharge(false)}>Cancel</Button>
            <Button type="submit" loading={updatingCharge}>Save Telemetry</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete modal */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Remove vehicle?" size="sm">
        <p className={styles.deleteMsg}>This will permanently remove <strong>{vehicle.model}</strong> ({vehicle.vin.slice(-6)}) from your fleet. This action cannot be undone.</p>
        <div className={styles.formActions}>
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Keep it</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Yes, remove</Button>
        </div>
      </Modal>
    </div>
  )
}
