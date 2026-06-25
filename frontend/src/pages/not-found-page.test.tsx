import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotFoundPage } from './not-found-page'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('NotFoundPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders 404 message', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Página não encontrada')).toBeInTheDocument()
    expect(screen.getByText(/A página que você está procurando não existe/)).toBeInTheDocument()
  })

  it('navigates to home when clicking "Voltar à Home"', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )

    const homeButton = screen.getByRole('button', { name: /voltar à home/i })
    await user.click(homeButton)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('navigates back when clicking "Voltar"', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )

    const backButton = screen.getByRole('button', { name: /^voltar$/i })
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('renders in catch-all route', () => {
    render(
      <MemoryRouter initialEntries={['/invalid-route']}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Página não encontrada')).toBeInTheDocument()
  })
})
