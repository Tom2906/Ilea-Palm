import type { ChartConfig } from "@/components/ui/chart"

/**
 * Standard teal pie segment styles, ordered by severity.
 * Each entry has a gradient fill ID and a solid legend color.
 */
export const pieStyles = {
  valid:     { fill: "url(#pieValid)",     legend: "hsl(180, 60%, 35%)" },
  completed: { fill: "url(#pieCompleted)", legend: "hsl(185, 65%, 58%)" },
  expiring:  { fill: "url(#pieExpiring)",  legend: "hsl(180, 45%, 55%)" },
  expired:   { fill: "url(#pieExpired)",   legend: "hsl(180, 30%, 65%)" },
  notDone:   { fill: "url(#pieNotDone)",   legend: "hsl(180, 15%, 78%)" },
} as const

/** Standard bar chart gradient fill IDs */
export const barStyles = {
  primary: "url(#barPrimary)",
  secondary: "url(#barSecondary)",
} as const

/**
 * SVG gradient and filter definitions for charts.
 * Call as a function — {chartGradientDefs()} — inside Recharts chart components.
 * Using a React component (<Component />) doesn't work because Recharts
 * only passes through raw SVG elements, not custom component wrappers.
 */
export function chartGradientDefs() {
  return (
    <defs>
      <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.12" />
      </filter>
      <linearGradient id="pieValid" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="hsl(180, 60%, 32%)" stopOpacity={0.95} />
        <stop offset="100%" stopColor="hsl(180, 60%, 42%)" stopOpacity={0.7} />
      </linearGradient>
      <linearGradient id="pieCompleted" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="hsl(185, 65%, 53%)" stopOpacity={0.95} />
        <stop offset="100%" stopColor="hsl(185, 65%, 63%)" stopOpacity={0.7} />
      </linearGradient>
      <linearGradient id="pieExpiring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="hsl(180, 45%, 50%)" stopOpacity={0.95} />
        <stop offset="100%" stopColor="hsl(180, 45%, 60%)" stopOpacity={0.7} />
      </linearGradient>
      <linearGradient id="pieExpired" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="hsl(180, 30%, 60%)" stopOpacity={0.95} />
        <stop offset="100%" stopColor="hsl(180, 30%, 70%)" stopOpacity={0.7} />
      </linearGradient>
      <linearGradient id="pieNotDone" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="hsl(180, 15%, 74%)" stopOpacity={0.9} />
        <stop offset="100%" stopColor="hsl(180, 15%, 82%)" stopOpacity={0.6} />
      </linearGradient>
      <linearGradient id="barPrimary" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(180, 60%, 40%)" stopOpacity={0.9} />
        <stop offset="100%" stopColor="hsl(180, 60%, 55%)" stopOpacity={0.6} />
      </linearGradient>
      <linearGradient id="barSecondary" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(220, 15%, 70%)" stopOpacity={0.4} />
        <stop offset="100%" stopColor="hsl(220, 15%, 80%)" stopOpacity={0.15} />
      </linearGradient>
    </defs>
  )
}

/** Standard hours chart config */
export const hoursChartConfig = {
  hours: { label: "Hours Worked", color: "hsl(var(--chart-1))" },
  target: { label: "Target", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

/** Standard compliance-by-category chart config */
export const complianceChartConfig = {
  compliant: { label: "Compliant", color: "hsl(var(--chart-1))" },
  total: { label: "Total", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

/** Build a ChartConfig from pie data entries */
export function buildPieConfig(
  data: Array<{ status: string; legendColor: string }>
): ChartConfig {
  return Object.fromEntries(
    data.map((d) => [d.status, { label: d.status, color: d.legendColor }])
  )
}
