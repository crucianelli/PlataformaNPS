import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
  headerClassName?: string
  sortable?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  emptyState?: ReactNode
  caption?: string
  className?: string
  stickyHeader?: boolean
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyState,
  caption,
  className,
  stickyHeader,
}: DataTableProps<T>) {
  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      <Table>
        {caption && <caption className="sr-only">{caption}</caption>}
        <TableHeader className={cn(stickyHeader && 'sticky top-0 z-[var(--z-table-sticky,20)]')}>
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => (
              <TableHead key={col.key} className={col.headerClassName}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center">
                {emptyState ?? (
                  <span className="text-sm text-muted-foreground">Sin resultados</span>
                )}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <TableRow key={keyExtractor(row)}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
