import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataGridLegend } from "./data-grid-legend"
import type { DataGridProps } from "./types"

export function DataGrid<TRow, TCol>({
  rows,
  columns,
  getRowKey,
  rowLabelHeader,
  renderRowLabel,
  renderCell,
  onCellClick,
  getCellClassName,
  legend = [],
  rowLabelWidth = 200,
  cellWidth = 48,
  cellHeight = 40,
  loading = false,
  emptyMessage = "No data found",
  summaryColumns = [],
}: DataGridProps<TRow, TCol>) {
  if (loading) {
    return (
      <div className="h-full flex flex-col gap-4">
        <div className="flex gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="flex-1 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col gap-4">
      {/* Legend */}
      {legend.length > 0 && (
        <div className="shrink-0">
          <DataGridLegend items={legend} />
        </div>
      )}

      {/* Grid */}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {emptyMessage}
        </p>
      ) : (
        <Card className="flex-1 min-h-0 overflow-hidden">
          <div
            className="h-full overflow-auto"
            style={{ scrollbarWidth: "thin" }}
          >
            <table className="text-sm border-collapse" style={{ tableLayout: "fixed" }}>
              <thead className="sticky top-0 z-20">
                <tr className="border-b bg-gray-50">
                  <th
                    className="sticky left-0 z-30 bg-gray-50 p-2 text-left font-semibold text-muted-foreground text-sm border-r"
                    style={{ width: rowLabelWidth, minWidth: rowLabelWidth }}
                  >
                    {rowLabelHeader}
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`p-1 text-center font-semibold text-muted-foreground text-xs ${col.headerClassName || ""}`}
                      style={{ width: cellWidth, minWidth: cellWidth }}
                    >
                      <div className="overflow-hidden text-ellipsis">
                        {col.header}
                      </div>
                    </th>
                  ))}
                  {summaryColumns.map((sumCol) => (
                    <th
                      key={sumCol.key}
                      className={`p-1 text-center font-semibold text-muted-foreground text-xs ${sumCol.className || ""}`}
                      style={{ width: sumCol.width || 60, minWidth: sumCol.width || 60 }}
                    >
                      {sumCol.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={getRowKey(row)} className="border-b group hover:bg-gray-50">
                    <td
                      className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 p-2 border-r transition-colors"
                      style={{ width: rowLabelWidth, minWidth: rowLabelWidth, maxWidth: rowLabelWidth }}
                    >
                      {renderRowLabel(row)}
                    </td>
                    {columns.map((col) => {
                      const cellClassName = getCellClassName?.(row, col) || ""
                      const handleClick = onCellClick ? () => onCellClick(row, col) : undefined
                      return (
                        <td
                          key={col.key}
                          className="p-1 text-center"
                          style={{ width: cellWidth, minWidth: cellWidth }}
                        >
                          <div
                            className={`rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                              handleClick ? "cursor-pointer hover:scale-105 hover:shadow-md" : ""
                            } ${cellClassName}`}
                            style={{ width: cellWidth - 8, height: cellHeight - 8, margin: "0 auto" }}
                            onClick={handleClick}
                          >
                            {renderCell(row, col)}
                          </div>
                        </td>
                      )
                    })}
                    {summaryColumns.map((sumCol) => (
                      <td
                        key={sumCol.key}
                        className={`p-1 text-center text-xs ${sumCol.className || ""}`}
                        style={{ width: sumCol.width || 60, minWidth: sumCol.width || 60 }}
                      >
                        {sumCol.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
