import { useState, useCallback } from "react"

export function useFilterState() {
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const toggle = useCallback((id: string) => {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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

  const isHidden = useCallback((id: string) => hidden.has(id), [hidden])

  return {
    hidden,
    toggle,
    toggleAll,
    clear,
    isHidden,
    hasFilters: hidden.size > 0,
  }
}
