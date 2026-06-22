import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Input } from './input'

describe('Input', () => {
  it('associates label and accepts typing', async () => {
    render(<Input label="Email" />)

    await userEvent.type(screen.getByLabelText('Email'), 'merchant@example.com')

    expect(screen.getByLabelText('Email')).toHaveValue('merchant@example.com')
  })

  it('shows accessible error state', () => {
    render(<Input label="Senha" error="Senha obrigatoria" />)

    const input = screen.getByLabelText('Senha')

    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Senha obrigatoria')).toBeInTheDocument()
  })
})
