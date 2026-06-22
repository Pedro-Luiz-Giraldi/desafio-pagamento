import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './modal'

describe('Modal', () => {
  it('does not render when closed', () => {
    render(
      <Modal open={false} title="Confirmar" onClose={vi.fn()}>
        Conteudo
      </Modal>,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders and closes from button', async () => {
    const onClose = vi.fn()
    render(
      <Modal open title="Confirmar" onClose={onClose}>
        Conteudo
      </Modal>,
    )

    expect(screen.getByRole('dialog', { name: 'Confirmar' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onClose).toHaveBeenCalledOnce()
  })
})
