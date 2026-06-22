import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('renders children and handles clicks', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Entrar</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('supports disabled state', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Salvando
      </Button>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Salvando' }))

    expect(onClick).not.toHaveBeenCalled()
  })
})
