import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | 'ellipsis')[] = []
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || (i >= page - 1 && i <= page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }

  return (
    <nav aria-label="Paginação" className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className={cn(
          'inline-flex min-h-9 min-w-9 items-center justify-center rounded-md text-sm transition-colors',
          'disabled:pointer-events-none disabled:opacity-50',
          'hover:bg-gray-100 text-gray-700',
        )}
      >
        Anterior
      </button>
      {pages.map((p, idx) =>
        p === 'ellipsis' ? (
          <span key={`e-${idx}`} className="min-h-9 min-w-9 flex items-center justify-center text-sm text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              'inline-flex min-h-9 min-w-9 items-center justify-center rounded-md text-sm font-medium transition-colors',
              p === page ? 'bg-emerald-700 text-white' : 'text-gray-700 hover:bg-gray-100',
            )}
          >
            {p + 1}
          </button>
        ),
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className={cn(
          'inline-flex min-h-9 min-w-9 items-center justify-center rounded-md text-sm transition-colors',
          'disabled:pointer-events-none disabled:opacity-50',
          'hover:bg-gray-100 text-gray-700',
        )}
      >
        Próximo
      </button>
    </nav>
  )
}
