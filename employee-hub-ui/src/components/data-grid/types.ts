import type { ReactNode } from "react"

export interface Column<TCol = unknown> {
  key: string
  data: TCol
  header: ReactNode
  headerClassName?: string
}

export interface LegendItem {
  color: string
  borderColor?: string
  label: string
}

export interface FilterConfig {
  key: string
  label: string
  items: { id: string; label: string }[]
}

export interface DataGridProps<TRow, TCol> {
  // Data
  rows: TRow[]
  columns: Column<TCol>[]
  getRowKey: (row: TRow) => string

  // Row label (sticky left column)
  rowLabelHeader?: ReactNode
  renderRowLabel: (row: TRow) => ReactNode

  // Cell rendering
  renderCell: (row: TRow, col: Column<TCol>) => ReactNode
  onCellClick?: (row: TRow, col: Column<TCol>) => void
  getCellClassName?: (row: TRow, col: Column<TCol>) => string

  // Legend
  legend?: LegendItem[]

  // Layout
  rowLabelWidth?: number
  cellWidth?: number
  cellHeight?: number

  // Loading state
  loading?: boolean
  emptyMessage?: string

  // Summary columns (after main grid)
  summaryColumns?: SummaryColumn<TRow>[]
}

export interface SummaryColumn<TRow> {
  key: string
  header: ReactNode
  render: (row: TRow) => ReactNode
  className?: string
  width?: number
}
