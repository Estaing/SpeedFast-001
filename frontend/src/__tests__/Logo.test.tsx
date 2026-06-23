import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Logo } from '../components/layout/Logo'

describe('Logo', () => {
  it('renders Speed and Fast text by default', () => {
    render(<Logo />)
    expect(screen.getByText('Speed')).toBeInTheDocument()
    expect(screen.getByText('Fast')).toBeInTheDocument()
  })

  it('hides text when showText is false', () => {
    render(<Logo showText={false} />)
    expect(screen.queryByText('Speed')).not.toBeInTheDocument()
    expect(screen.queryByText('Fast')).not.toBeInTheDocument()
  })

  it('renders the SVG lightning bolt icon', () => {
    const { container } = render(<Logo />)
    expect(container.querySelector('svg')).not.toBeNull()
  })
})
