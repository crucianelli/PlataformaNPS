import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  getPageUrl: (page: number) => string
  itemLabel?: string
}

function getPageRange(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | null)[] = [1]
  if (current > 3) pages.push(null)
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push(null)
  pages.push(total)
  return pages
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  getPageUrl,
  itemLabel = 'resultados',
}: PaginationProps) {
  if (totalPages <= 1) return null

  const from = (currentPage - 1) * pageSize + 1
  const to   = Math.min(currentPage * pageSize, totalItems)
  const pages = getPageRange(currentPage, totalPages)

  const btnBase = cn(
    'inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-md text-sm font-medium',
    'transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  )

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
      <p className="font-mono text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{from}–{to}</span> de{' '}
        <span className="font-semibold text-foreground">{totalItems}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-1">
        {currentPage > 1 ? (
          <Link href={getPageUrl(currentPage - 1)} className={cn(btnBase, 'text-muted-foreground hover:bg-muted hover:text-foreground')} aria-label="Página anterior">
            <ChevronLeft size={14} />
          </Link>
        ) : (
          <span className={cn(btnBase, 'cursor-not-allowed text-muted-foreground/40')} aria-disabled="true">
            <ChevronLeft size={14} />
          </span>
        )}

        {pages.map((page, idx) =>
          page === null ? (
            <span key={`ellipsis-${idx}`} className="w-6 text-center text-xs text-muted-foreground">
              ···
            </span>
          ) : (
            <Link
              key={page}
              href={getPageUrl(page)}
              aria-current={page === currentPage ? 'page' : undefined}
              className={cn(
                btnBase,
                page === currentPage
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {page}
            </Link>
          )
        )}

        {currentPage < totalPages ? (
          <Link href={getPageUrl(currentPage + 1)} className={cn(btnBase, 'text-muted-foreground hover:bg-muted hover:text-foreground')} aria-label="Página siguiente">
            <ChevronRight size={14} />
          </Link>
        ) : (
          <span className={cn(btnBase, 'cursor-not-allowed text-muted-foreground/40')} aria-disabled="true">
            <ChevronRight size={14} />
          </span>
        )}
      </div>
    </div>
  )
}
