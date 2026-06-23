import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Input } from '../components/ui/Input'

describe('Input', () => {
  it('renders label correctly and associates it with the input', () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('shows error message with role=alert', () => {
    render(<Input label="Email" error="Invalid email" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email')
  })

  it('does not show hint when error is present', () => {
    render(<Input label="Email" error="Required" hint="Enter your email" />)
    expect(screen.queryByText('Enter your email')).not.toBeInTheDocument()
  })

  it('shows hint when there is no error', () => {
    render(<Input label="Email" hint="We never share your email" />)
    expect(screen.getByText('We never share your email')).toBeInTheDocument()
  })
})
