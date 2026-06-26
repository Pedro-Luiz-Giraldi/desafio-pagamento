import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RegisterPage } from './register-page'
import { authApi } from '@/api/auth.api'

vi.mock('@/api/auth.api', () => ({
  authApi: {
    register: vi.fn(),
  },
}))

const mockedAuthApi = vi.mocked(authApi)

function renderRegister() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates required fields', async () => {
    renderRegister()

    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Nome obrigatorio')).toBeInTheDocument()
    expect(screen.getByText('Nome da empresa obrigatorio')).toBeInTheDocument()
    expect(screen.getByText('CNPJ obrigatorio')).toBeInTheDocument()
    expect(screen.getByText('Email obrigatorio')).toBeInTheDocument()
    expect(screen.getByText('Senha obrigatoria')).toBeInTheDocument()
    expect(mockedAuthApi.register).not.toHaveBeenCalled()
  })

  it('registers merchant and shows email confirmation message', async () => {
    mockedAuthApi.register.mockResolvedValueOnce({
      userId: 'user-1',
      email: 'merchant@example.com',
      role: 'MERCHANT_OWNER',
      merchantId: 'merchant-1',
      emailConfirmed: false,
    })
    renderRegister()

    await userEvent.type(screen.getByLabelText('Nome'), 'Merchant User')
    await userEvent.type(screen.getByLabelText('Nome da Empresa'), 'Test Company')
    await userEvent.type(screen.getByLabelText('CNPJ'), '11.222.333/0001-81')
    await userEvent.type(screen.getByLabelText('Email'), 'merchant@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'Senha@1234')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(mockedAuthApi.register).toHaveBeenCalledWith({
      fullName: 'Merchant User',
      email: 'merchant@example.com',
      password: 'Senha@1234',
      companyName: 'Test Company',
      cnpj: '11222333000181',
    })
    expect(await screen.findByText(/link de confirmacao foi enviado/i)).toBeInTheDocument()
  })

  it('shows registration errors', async () => {
    mockedAuthApi.register.mockRejectedValueOnce(new Error('Email ja cadastrado'))
    renderRegister()

    await userEvent.type(screen.getByLabelText('Nome'), 'Merchant User')
    await userEvent.type(screen.getByLabelText('Nome da Empresa'), 'Test Company')
    await userEvent.type(screen.getByLabelText('CNPJ'), '11.222.333/0001-81')
    await userEvent.type(screen.getByLabelText('Email'), 'merchant@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'Senha@1234')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Email ja cadastrado'))
  })

  it('validates CNPJ format', async () => {
    renderRegister()

    await userEvent.type(screen.getByLabelText('Nome'), 'Merchant User')
    await userEvent.type(screen.getByLabelText('Nome da Empresa'), 'Test Company')
    await userEvent.type(screen.getByLabelText('CNPJ'), '123')
    await userEvent.type(screen.getByLabelText('Email'), 'merchant@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'Senha@1234')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('CNPJ invalido (use XX.XXX.XXX/XXXX-XX)')).toBeInTheDocument()
    expect(mockedAuthApi.register).not.toHaveBeenCalled()
  })

  it('validates CNPJ checksum', async () => {
    renderRegister()

    await userEvent.type(screen.getByLabelText('Nome'), 'Merchant User')
    await userEvent.type(screen.getByLabelText('Nome da Empresa'), 'Test Company')
    await userEvent.type(screen.getByLabelText('CNPJ'), '11.222.333/0001-00')
    await userEvent.type(screen.getByLabelText('Email'), 'merchant@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'Senha@1234')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('CNPJ invalido')).toBeInTheDocument()
    expect(mockedAuthApi.register).not.toHaveBeenCalled()
  })

  it('formats CNPJ as user types', async () => {
    renderRegister()

    const cnpjInput = screen.getByLabelText('CNPJ')
    await userEvent.type(cnpjInput, '11222333000181')

    expect(cnpjInput).toHaveValue('11.222.333/0001-81')
  })
})
