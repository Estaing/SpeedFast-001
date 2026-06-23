import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { VehicleCard } from '@/components/vehicles/VehicleCard'
import { AddVehicleForm } from '@/components/vehicles/AddVehicleForm'
import { useVehicles } from '@/hooks/useVehicles'
import styles from './VehiclesPage.module.css'

const PAGE_SIZE = 12

export function VehiclesPage() {
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { data, isLoading } = useVehicles(page, PAGE_SIZE)

  const vehicles = (data?.items ?? []).filter(v =>
    !search || v.vin.toLowerCase().includes(search.toLowerCase()) || v.model.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE)

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Fleet</h1>
          <p className={styles.sub}>{data?.total ?? 0} vehicles registered</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus size={16}/> Add Vehicle</Button>
      </div>

      <div className={styles.searchBar}>
        <Search size={16} className={styles.searchIcon} />
        <input className={styles.searchInput} placeholder="Search by VIN or model…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className={styles.grid}>
          {[...Array(6)].map((_, i) => <div key={i} className={`skeleton ${styles.skCard}`} />)}
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {vehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
          {vehicles.length === 0 && !isLoading && (
            <div className={styles.empty}>
              <p>{search ? 'No vehicles match your search.' : 'No vehicles yet.'}</p>
              {!search && <Button onClick={() => setAddOpen(true)}><Plus size={16}/>Add first vehicle</Button>}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p-1)}>Previous</Button>
          <span className={styles.pageInfo}>{page} / {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p+1)}>Next</Button>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Register a Vehicle">
        <AddVehicleForm onSuccess={() => setAddOpen(false)} onCancel={() => setAddOpen(false)} />
      </Modal>
    </div>
  )
}
