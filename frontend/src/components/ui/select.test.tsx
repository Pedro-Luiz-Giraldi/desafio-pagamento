import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from './select'

const options = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendente' },
]

describe('Select', () => {
  it('renders label and options', () => {
    render(<Select label="Status" options={options} />)
    expect(screen.getByLabelText('Status')).toBeInTheDocument()
    expect(screen.getByText('Todos')).toBeInTheDocument()
    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })

  it('displays error message', () => {
    render(<Select label="Status" options={options} error="Campo obrigatório" />)
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toHaveAttribute('aria-invalid', 'true')
  })

  it('allows selecting an option', async () => {
    render(<Select label="Status" options={options} />)
    const select = screen.getByLabelText('Status') as HTMLSelectElement
    await userEvent.selectOptions(select, 'PENDING')
    expect(select.value).toBe('PENDING')
  })
})
