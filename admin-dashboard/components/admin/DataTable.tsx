'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableSkeleton, EmptyState } from './EmptyState'
import { LucideIcon } from 'lucide-react'

export interface Column<T> {
  header: string
  accessor: keyof T | string
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  onEmptyAction?: { label: string; onClick: () => void }
  rowKey?: (row: T) => string
  onRowClick?: (row: T) => void
  pageSize?: number
}

type SortDir = 'asc' | 'desc' | null

export function DataTable<T extends object>({
  data,
  columns,
  isLoading,
  emptyIcon,
  emptyTitle = 'Aucune donnée',
  emptyDescription,
  onEmptyAction,
  rowKey,
  onRowClick,
  pageSize: defaultPageSize = 10,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  const sorted = useMemo(() => {
    if (!sortCol || !sortDir) return data
    return [...data].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortCol] as string | number
      const bv = (b as Record<string, unknown>)[sortCol] as string | number
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortCol, sortDir])

  const total = sorted.length
  const totalPages = Math.ceil(total / pageSize)
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

  function handleSort(col: string) {
    if (sortCol !== col) { setSortCol(col); setSortDir('asc'); return }
    if (sortDir === 'asc') setSortDir('desc')
    else { setSortCol(null); setSortDir(null) }
  }

  function SortIcon({ col }: { col: string }) {
    if (sortCol !== col) return <ChevronsUpDown className="w-3 h-3 text-[var(--text-subtle)]" />
    if (sortDir === 'asc') return <ChevronUp className="w-3 h-3 text-[var(--accent)]" />
    return <ChevronDown className="w-3 h-3 text-[var(--accent)]" />
  }

  if (isLoading) return <TableSkeleton cols={columns.length} />

  if (!data.length) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={onEmptyAction}
      />
    )
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {columns.map((col) => (
                <th
                  key={String(col.accessor)}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.sortable && 'cursor-pointer hover:text-[var(--text)] select-none'
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(String(col.accessor))}
                >
                  <div className={cn('flex items-center gap-1', col.align === 'right' && 'justify-end', col.align === 'center' && 'justify-center')}>
                    {col.header}
                    {col.sortable && <SortIcon col={String(col.accessor)} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row) : i}
                className={cn(
                  'border-b border-[var(--border)] transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-[var(--bg-subtle)]'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.accessor)}
                    className={cn(
                      'px-4 py-3 text-[var(--text)]',
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    )}
                  >
                    {col.cell
                      ? col.cell(row)
                      : String(row[col.accessor as keyof T] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>Lignes par page:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="border border-[var(--border)] rounded-md px-2 py-1 bg-[var(--surface)] text-[var(--text)] text-xs"
          >
            {[10, 25, 50].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} sur {total}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-md hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let p = i + 1
            if (totalPages > 5) {
              if (page > 3) p = page - 2 + i
              if (page > totalPages - 2) p = totalPages - 4 + i
            }
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'w-7 h-7 rounded-md text-xs font-medium transition-colors',
                  page === p
                    ? 'bg-[var(--accent)] text-white'
                    : 'hover:bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                )}
              >
                {p}
              </button>
            )
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-md hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>
      </div>
    </div>
  )
}
