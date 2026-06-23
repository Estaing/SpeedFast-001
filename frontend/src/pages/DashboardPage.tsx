import { useState } from 'react'
import { Plus, Car, Zap, Battery, Navigation, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { VehicleCard } from '@/components/vehicles/VehicleCard'
import { AddVehicleForm } from '@/components/vehicles/AddVehicleForm'
import { useVehicles } from '@/hooks/useVehicles'
import { useAuthStore } from '@/store/auth'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const { user } = useAuthStore()
  const { data, isLoading, error, refetch, isFetching } = useVehicles()
  const [addOpen, setAddOpen] = useState(false)

  const vehicles = data?.items ?? []
  const total    = data?.total ?? 0

  // Aggregate stats
  const avgBattery    = vehicles.length ? Math.round(vehicles.reduce((s, v) => s + (v.chargeStatus?.batteryLevel ?? 0), 0) / vehicles.length) : 0
  const chargingCount = vehicles.filter(v => v.chargeStatus?.isCharging).length
  const avgRange      = vehicles.length ? Math.round(vehicles.reduce((s, v) => s + (v.chargeStatus?.rangeKm ?? 0), 0) / vehicles.length) : 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className={styles.root}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{greeting}, {user?.email?.split('@')[0]}</h1>
          <p className={styles.pageSub}>Here's your fleet at a glance</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" size="sm" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw size={15} />Refresh
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={16} />Add Vehicle
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon}><Car size={20} /></div>
          <div className={styles.statValue}>{total}</div>
          <div className={styles.statLabel}>Total Vehicles</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.green}`}><Battery size={20} /></div>
          <div className={styles.statValue}>{avgBattery}%</div>
          <div className={styles.statLabel}>Avg Battery</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.orange}`}><Zap size={20} /></div>
          <div className={styles.statValue}>{chargingCount}</div>
          <div className={styles.statLabel}>Charging Now</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blue}`}><Navigation size={20} /></div>
          <div className={styles.statValue}>{avgRange} km</div>
          <div className={styles.statLabel}>Avg Range</div>
        </Card>
      </div>

      {/* Fleet grid */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Your Fleet</h2>
        {total > 0 && <Badge variant="info">{total} vehicle{total !== 1 ? 's' : ''}</Badge>}
      </div>

      {isLoading ? (
        <div className={styles.grid}>
          {[...Array(4)].map((_, i) => <div key={i} className={`skeleton ${styles.skeletonCard}`} />)}
        </div>
      ) : error ? (
        <Card className={styles.emptyState}>
          <p style={{ color: 'var(--red)' }}>Failed to load vehicles. <button className={styles.retry} onClick={() => refetch()}>Try again</button></p>
        </Card>
      ) : vehicles.length === 0 ? (
        <Card className={styles.emptyState} glow>
          <div className={styles.emptyIcon}><Car size={40} /></div>
          <h3 className={styles.emptyTitle}>No vehicles yet</h3>
          <p className={styles.emptySub}>Register your first VinFast EV to start monitoring your fleet.</p>
          <Button onClick={() => setAddOpen(true)}><Plus size={16} />Add your first vehicle</Button>
        </Card>
      ) : (
        <div className={styles.grid}>
          {vehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}
          <Card onClick={() => setAddOpen(true)} className={styles.addCard}>
            <div className={styles.addInner}><Plus size={28} /><span>Add vehicle</span></div>
          </Card>
        </div>
      )}

      {/* Add vehicle modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Register a Vehicle">
        <AddVehicleForm onSuccess={() => setAddOpen(false)} onCancel={() => setAddOpen(false)} />
      </Modal>
    </div>
  )
}
