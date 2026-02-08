/** Shared shift type color map — used by rota grid, calendar, and dashboard components */
export const shiftColorMap: Record<string, { cell: string; legend: string; border: string }> = {
  A:   { cell: "bg-blue-100 border border-blue-200 text-blue-800",       legend: "bg-blue-100",   border: "border border-blue-200" },
  D:   { cell: "bg-amber-100 border border-amber-200 text-amber-800",    legend: "bg-amber-100",  border: "border border-amber-200" },
  DS:  { cell: "bg-purple-100 border border-purple-200 text-purple-800",  legend: "bg-purple-100", border: "border border-purple-200" },
  S:   { cell: "bg-indigo-100 border border-indigo-200 text-indigo-800",  legend: "bg-indigo-100", border: "border border-indigo-200" },
  E:   { cell: "bg-green-100 border border-green-200 text-green-800",    legend: "bg-green-100",  border: "border border-green-200" },
  L:   { cell: "bg-red-100 border border-red-200 text-red-800",          legend: "bg-red-100",    border: "border border-red-200" },
  RDO: { cell: "bg-gray-200 border border-gray-300 text-gray-600",       legend: "bg-gray-200",   border: "border border-gray-300" },
}

/** Simple cell-only color map for calendar views (my-rota) */
export const shiftCellColorMap: Record<string, string> = {
  A:   "bg-blue-100 border-blue-200 text-blue-800",
  D:   "bg-amber-100 border-amber-200 text-amber-800",
  DS:  "bg-purple-100 border-purple-200 text-purple-800",
  S:   "bg-indigo-100 border-indigo-200 text-indigo-800",
  E:   "bg-green-100 border-green-200 text-green-800",
  L:   "bg-red-100 border-red-200 text-red-800",
  RDO: "bg-gray-200 border-gray-300 text-gray-600",
}
