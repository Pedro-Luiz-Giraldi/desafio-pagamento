import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Skeleton } from './skeleton'
import { Spinner } from './spinner'

describe('loading primitives', () => {
  it('renders spinner with accessible label', () => {
    render(<Spinner label="Carregando dados" />)

    expect(screen.getByRole('status', { name: 'Carregando dados' })).toBeInTheDocument()
  })

  it('renders skeleton as hidden placeholder', () => {
    render(<Skeleton data-testid="skeleton" className="h-10" />)

    expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-hidden', 'true')
  })
})
