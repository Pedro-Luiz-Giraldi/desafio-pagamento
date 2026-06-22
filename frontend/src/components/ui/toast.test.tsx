import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Toaster } from './toast'
import { toast } from '@/lib/toast-store'

describe('toast', () => {
  it('shows success messages', async () => {
    render(<Toaster />)

    toast.success('Operacao concluida')

    expect(await screen.findByText('Operacao concluida')).toBeInTheDocument()
  })

  it('shows error messages as alerts', async () => {
    render(<Toaster />)

    toast.error('Falha ao autenticar')

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao autenticar')
  })
})
