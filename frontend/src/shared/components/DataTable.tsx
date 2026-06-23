import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingState } from './LoadingState'
import { EmptyState } from './EmptyState'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  keyExtractor: (row: T) => string
  page?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage,
  keyExtractor,
  page = 0,
  totalPages = 0,
  onPageChange,
}: DataTableProps<T>) {
  if (loading) return <LoadingState rows={6} />
  if (data.length === 0) return <EmptyState message={emptyMessage} />

  const hasPagination = totalPages > 1 && onPageChange

  return (
    <div className="space-y-3">
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {data.map(row => (
              <tr key={keyExtractor(row)} className="hover:bg-muted/20 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasPagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {page + 1} de {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
