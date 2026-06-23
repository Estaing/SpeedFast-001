import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BatteryArc } from '../components/vehicles/BatteryArc'

describe('BatteryArc', () => {
  it('displays the battery percentage', () => {
    render(<BatteryArc level={75} isCharging={false} />)
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('shows charging indicator dot when isCharging is true', () => {
    const { container } = render(<BatteryArc level={50} isCharging={true} />)
    const dot = container.querySelector('[class*="chargingDot"]')
    expect(dot).not.toBeNull()
  })

  it('does not show charging dot when idle', () => {
    const { container } = render(<BatteryArc level={50} isCharging={false} />)
    const dot = container.querySelector('[class*="chargingDot"]')
    expect(dot).toBeNull()
  })
})
