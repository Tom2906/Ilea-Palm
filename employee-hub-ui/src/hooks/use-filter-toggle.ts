import { useCallback, useState } from "react"

export function useFilterToggle() {
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const toggle = useCallback((id: string) => {
    setHidden((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback((ids: string[], hide: boolean) => {
    setHidden((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (hide ? next.add(id) : next.delete(id)))
      return next
    })
  }, [])

  const clear = useCallback(() => setHidden(new Set()), [])

  return { hidden, setHidden, toggle, toggleAll, clear }
}
