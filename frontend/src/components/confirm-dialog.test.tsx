import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './confirm-dialog'

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<ConfirmDialog open={false} title="Test" message="Msg" onConfirm={() => {}} onCancel={() => {}} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders title and message when open', () => {
    render(<ConfirmDialog open={true} title="Confirmar" message="Tem certeza?" onConfirm={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Confirmar' })).toBeInTheDocument()
    expect(screen.getByText('Tem certeza?')).toBeInTheDocument()
  })

  it('calls onConfirm when clicking confirm button', async () => {
    const onConfirm = vi.fn()
    render(<ConfirmDialog open={true} title="Test" message="Msg" onConfirm={onConfirm} onCancel={() => {}} />)
    await userEvent.click(screen.getByText('Confirmar'))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when clicking cancel button', async () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog open={true} title="Test" message="Msg" onConfirm={() => {}} onCancel={onCancel} />)
    await userEvent.click(screen.getByText('Cancelar'))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
