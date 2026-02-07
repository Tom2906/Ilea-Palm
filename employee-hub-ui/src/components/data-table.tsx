import { type ReactNode, useState, Fragment } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, ChevronRight, ChevronDown } from "lucide-react"

export interface DataTableColumn<TRow> {
  key: string
  header: string
  render: (row: TRow) => ReactNode
  className?: string
}

interface DataTableProps<TRow> {
  columns: DataTableColumn<TRow>[]
  rows: TRow[]
  getRowKey: (row: TRow) => string
  renderDetail?: (row: TRow) => ReactNode
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  toolbar?: ReactNode
  loading?: boolean
  emptyMessage?: string
}

export function DataTable<TRow>({
  columns,
  rows,
  getRowKey,
  renderDetail,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  toolbar,
  loading = false,
  emptyMessage = "No data found.",
}: DataTableProps<TRow>) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const hasSearch = onSearchChange !== undefined
  const hasToolbar = hasSearch || toolbar
  const expandable = !!renderDetail

  if (loading) {
    return (
      <div className="h-full flex flex-col gap-4">
        {hasToolbar && (
          <div className="flex items-center justify-between gap-2 shrink-0">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-8 w-24" />
          </div>
        )}
        <Card className="flex-1 min-h-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {expandable && <TableHead className="w-8" />}
                  {columns.map((col) => (
                    <TableHead key={col.key}>{col.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(8)].map((_, i) => (
                  <TableRow key={i}>
                    {expandable && (
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {hasToolbar && (
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div>
            {hasSearch && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue ?? ""}
                  onChange={(e) => onSearchChange!(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {toolbar}
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {emptyMessage}
        </p>
      ) : (
        <Card className="flex-1 min-h-0 overflow-hidden">
          <CardContent className="h-full p-0">
            <div className="h-full overflow-auto" style={{ scrollbarWidth: "thin" }}>
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    {expandable && <TableHead className="w-8" />}
                    {columns.map((col) => (
                      <TableHead key={col.key}>
                        {col.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const key = getRowKey(row)
                    const isExpanded = expandedId === key
                    return (
                      <Fragment key={key}>
                        <TableRow
                          className={expandable ? "cursor-pointer" : ""}
                          onClick={expandable ? () => setExpandedId(isExpanded ? null : key) : undefined}
                        >
                          {expandable && (
                            <TableCell className="w-8 px-2">
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </TableCell>
                          )}
                          {columns.map((col) => (
                            <TableCell key={col.key} className={col.className}>
                              {col.render(row)}
                            </TableCell>
                          ))}
                        </TableRow>
                        {isExpanded && renderDetail && (
                          <TableRow>
                            <TableCell />
                            <TableCell colSpan={columns.length}>
                              {renderDetail(row)}
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
