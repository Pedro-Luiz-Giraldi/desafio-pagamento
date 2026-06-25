import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './status-badge'

describe('StatusBadge', () => {
  it('renders PENDING status', () => {
    render(<StatusBadge status="PENDING" />)
    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })

  it('renders APPROVED status', () => {
    render(<StatusBadge status="APPROVED" />)
    expect(screen.getByText('Aprovado')).toBeInTheDocument()
  })

  it('renders DECLINED status', () => {
    render(<StatusBadge status="DECLINED" />)
    expect(screen.getByText('Recusado')).toBeInTheDocument()
  })

  it('renders CANCELLED status', () => {
    render(<StatusBadge status="CANCELLED" />)
    expect(screen.getByText('Cancelado')).toBeInTheDocument()
  })

  it('renders REFUNDED status', () => {
    render(<StatusBadge status="REFUNDED" />)
    expect(screen.getByText('Reembolsado')).toBeInTheDocument()
  })
})
