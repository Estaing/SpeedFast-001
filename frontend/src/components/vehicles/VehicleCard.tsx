import { useNavigate } from 'react-router-dom'
import { Zap, Navigation, Calendar, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BatteryArc } from './BatteryArc'
import type { Vehicle } from '@/types'
import styles from './VehicleCard.module.css'

interface Props { vehicle: Vehicle }

const MODEL_LABELS: Record<string, string> = {
  VF3: 'VF 3', VF5: 'VF 5', VF6: 'VF 6', VF7: 'VF 7', VF8: 'VF 8', VF9: 'VF 9',
}

export function VehicleCard({ vehicle }: Props) {
  const navigate = useNavigate()
  const charge = vehicle.chargeStatus
  const batteryLevel = charge?.batteryLevel ?? 0
  const isCharging  = charge?.isCharging ?? false
  const rangeKm     = charge?.rangeKm ?? 0

  return (
    <Card onClick={() => navigate(`/vehicles/${vehicle.id}`)} className={styles.card}>
      <div className={styles.header}>
        <div className={styles.modelInfo}>
          <span className={styles.modelLabel}>{MODEL_LABELS[vehicle.model] ?? vehicle.model}</span>
          <span className={styles.vin}>VIN · {vehicle.vin.slice(-6)}</span>
        </div>
        <BatteryArc level={batteryLevel} isCharging={isCharging} size={90} />
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <Navigation size={13} className={styles.statIcon} />
          <span>{rangeKm.toFixed(0)} km</span>
          <span className={styles.statLabel}>Range</span>
        </div>
        <div className={styles.stat}>
          <Zap size={13} className={styles.statIcon} />
          <span>{vehicle.batteryCapacity} kWh</span>
          <span className={styles.statLabel}>Capacity</span>
        </div>
        <div className={styles.stat}>
          <Calendar size={13} className={styles.statIcon} />
          <span>{new Date(vehicle.createdAt).getFullYear()}</span>
          <span className={styles.statLabel}>Added</span>
        </div>
      </div>

      <div className={styles.footer}>
        {isCharging
          ? <Badge variant="success">⚡ Charging</Badge>
          : <Badge variant="info">Idle</Badge>
        }
        <span className={styles.viewLink}>View details <ChevronRight size={14} /></span>
      </div>
    </Card>
  )
}
