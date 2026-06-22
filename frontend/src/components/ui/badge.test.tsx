import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './badge'

describe('Badge', () => {
  it('renders content', () => {
    render(<Badge variant="success">Pago</Badge>)

    expect(screen.getByText('Pago')).toBeInTheDocument()
  })
})
