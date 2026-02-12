import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { chartGradientDefs, barStyles } from "@/lib/chart-styles"

interface ComparisonBarChartProps {
  data: Record<string, unknown>[]
  /** Config for the chart legend/tooltips */
  config: ChartConfig
  /** Data key for the X axis labels */
  categoryKey: string
  /** Data key for the primary (teal) bars */
  primaryKey: string
  /** Data key for the secondary (grey) bars */
  secondaryKey: string
  /** Unique key to force re-render when data source changes */
  chartKey?: string | number
  /** Bar width — omit for auto */
  barSize?: number
  /** Empty state message when no data */
  emptyMessage?: string
  /** Wrap the chart in a click handler */
  onClick?: () => void
  /** Legend entries — omit to hide legend */
  legend?: { primary: string; secondary: string; primaryValue?: string; secondaryValue?: string }
}

export function ComparisonBarChart({
  data,
  config,
  categoryKey,
  primaryKey,
  secondaryKey,
  chartKey,
  barSize,
  emptyMessage = "No data",
  onClick,
  legend,
}: ComparisonBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="px-5 pb-5">
        <p className="text-sm text-muted-foreground py-8 text-center">
          {emptyMessage}
        </p>
      </div>
    )
  }

  const chart = (
    <ChartContainer config={config} className="h-[220px] w-full">
      <BarChart
        key={chartKey}
        data={data}
        margin={{ top: 8, right: 0, left: -20, bottom: 0 }}
        barSize={barSize}
      >
        {chartGradientDefs()}
        <XAxis
          dataKey={categoryKey}
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <YAxis tickLine={false} axisLine={false} fontSize={12} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey={primaryKey}
          fill={barStyles.primary}
          radius={[6, 6, 0, 0]}
        />
        <Bar
          dataKey={secondaryKey}
          fill={barStyles.secondary}
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )

  return (
    <div className="px-5 pb-5">
      {onClick ? (
        <div className="cursor-pointer" onClick={onClick}>
          {chart}
        </div>
      ) : (
        chart
      )}
      {legend && (
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: "hsl(180, 60%, 40%)" }}
            />
            <span className="text-xs text-muted-foreground">
              {legend.primary}
              {legend.primaryValue != null ? ` (${legend.primaryValue})` : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: "hsl(220, 15%, 75%)" }}
            />
            <span className="text-xs text-muted-foreground">
              {legend.secondary}
              {legend.secondaryValue != null
                ? ` (${legend.secondaryValue})`
                : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
