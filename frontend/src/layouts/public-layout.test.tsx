import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PublicLayout } from './public-layout'

describe('PublicLayout', () => {
  it('renders app identity and children', () => {
    render(
      <PublicLayout>
        <form aria-label="Formulario de login" />
      </PublicLayout>,
    )

    expect(screen.getByText('Acabou o Mony')).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Formulario de login' })).toBeInTheDocument()
  })
})
