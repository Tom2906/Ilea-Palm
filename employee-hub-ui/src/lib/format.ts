export function formatDate(dateStr: string | null) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-GB")
}

export function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB")
}
