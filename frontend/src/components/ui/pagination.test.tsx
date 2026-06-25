import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from './pagination'

describe('Pagination', () => {
  it('renders nothing when totalPages is 1 or less', () => {
    const { container } = render(<Pagination page={0} totalPages={1} onPageChange={() => {}} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders page buttons', () => {
    render(<Pagination page={0} totalPages={3} onPageChange={() => {}} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('calls onPageChange when clicking a page', async () => {
    const onPageChange = vi.fn()
    render(<Pagination page={0} totalPages={3} onPageChange={onPageChange} />)
    await userEvent.click(screen.getByText('2'))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('disables previous button on first page', () => {
    render(<Pagination page={0} totalPages={3} onPageChange={() => {}} />)
    expect(screen.getByText('Anterior')).toBeDisabled()
  })

  it('disables next button on last page', () => {
    render(<Pagination page={2} totalPages={3} onPageChange={() => {}} />)
    expect(screen.getByText('Próximo')).toBeDisabled()
  })
})
