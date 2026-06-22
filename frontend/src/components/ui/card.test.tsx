import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './card'

describe('Card', () => {
  it('composes card sections', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Titulo</CardTitle>
        </CardHeader>
        <CardContent>Conteudo</CardContent>
        <CardFooter>Rodape</CardFooter>
      </Card>,
    )

    expect(screen.getByRole('heading', { name: 'Titulo' })).toBeInTheDocument()
    expect(screen.getByText('Conteudo')).toBeInTheDocument()
    expect(screen.getByText('Rodape')).toBeInTheDocument()
  })
})
