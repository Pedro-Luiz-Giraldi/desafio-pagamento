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
          'inline-flex h-9 px-3 items-center justify-center rounded-lg text-sm font-medium transition-smooth',
          'disabled:pointer-events-none disabled:opacity-40',
          'hover:bg-slate-100 text-slate-700',
        )}
      >
        Anterior
      </button>
      {pages.map((p, idx) =>
        p === 'ellipsis' ? (
          <span key={`e-${idx}`} className="h-9 w-9 flex items-center justify-center text-sm text-slate-400">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-smooth',
              p === page ? 'bg-[#0A2540] text-white' : 'text-slate-700 hover:bg-slate-100',
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
          'inline-flex h-9 px-3 items-center justify-center rounded-lg text-sm font-medium transition-smooth',
          'disabled:pointer-events-none disabled:opacity-40',
          'hover:bg-slate-100 text-slate-700',
        )}
      >
        Próximo
      </button>
    </nav>
  )
}
