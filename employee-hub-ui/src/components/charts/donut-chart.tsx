import { Label, Pie, PieChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { chartGradientDefs, buildPieConfig } from "@/lib/chart-styles"

export interface DonutSlice {
  status: string
  count: number
  fill: string
  legendColor: string
}

interface FilterOption {
  value: string
  label: string
}

interface DonutChartProps {
  data: DonutSlice[]
  /** Percentage shown in the center of the donut */
  centerValue: string
  /** Label shown below the center value */
  centerLabel: string
  /** Unique key to force re-render when data source changes */
  chartKey?: string | number
  /** Empty state message when no data */
  emptyMessage?: string
  /** Dropdown filter options — omit to hide the dropdown */
  filterOptions?: FilterOption[]
  /** Currently selected filter value */
  filterValue?: string
  /** Called when the dropdown selection changes */
  onFilterChange?: (value: string) => void
  /** Called when a pie slice is clicked */
  onSliceClick?: (slice: DonutSlice) => void
  /** Called when a legend item is clicked */
  onLegendClick?: (slice: DonutSlice) => void
}

export function DonutChart({
  data,
  centerValue,
  centerLabel,
  chartKey,
  emptyMessage = "No data",
  filterOptions,
  filterValue,
  onFilterChange,
  onSliceClick,
  onLegendClick,
}: DonutChartProps) {
  const config = buildPieConfig(data)
  const hasData = data.length > 0
  const clickable = !!onSliceClick || !!onLegendClick

  return (
    <>
      {filterOptions && filterOptions.length > 1 && (
        <div className="px-5 pt-1 pb-1">
          <select
            className="text-xs border rounded px-2 py-1 bg-background"
            value={filterValue}
            onChange={(e) => onFilterChange?.(e.target.value)}
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="px-5 pb-5">
        {!hasData ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {emptyMessage}
          </p>
        ) : (
          <ChartContainer
            config={config}
            className="mx-auto aspect-square max-h-[220px]"
          >
            <PieChart key={chartKey}>
              {chartGradientDefs()}
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                innerRadius={60}
                outerRadius={90}
                strokeWidth={3}
                stroke="hsl(var(--background))"
                style={{
                  filter: "url(#pieShadow)",
                  cursor: onSliceClick ? "pointer" : undefined,
                }}
                onClick={
                  onSliceClick
                    ? (_, index) => onSliceClick(data[index])
                    : undefined
                }
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 6}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {centerValue}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 16}
                            className="fill-muted-foreground text-[11px] font-medium"
                          >
                            {centerLabel}
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
        {hasData && (
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {data.map((d) => (
              <div
                key={d.status}
                className={`flex items-center gap-1.5${
                  clickable
                    ? " cursor-pointer hover:opacity-70 transition-opacity"
                    : ""
                }`}
                onClick={onLegendClick ? () => onLegendClick(d) : undefined}
              >
                <div
                  className="h-2.5 w-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: d.legendColor }}
                />
                <span className="text-xs text-muted-foreground">
                  {d.status} ({d.count})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
