import { useState, useCallback, useMemo, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { GridView, ViewConfig } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"

const EMPTY_CONFIG: ViewConfig = {
  hiddenFilters: [],
  rowOrder: [],
  hiddenColumns: [],
  columnOrder: [],
}

interface UseViewManagerOptions {
  gridType: string
  defaultHiddenFilters?: Set<string>
}

export function useViewManager({ gridType, defaultHiddenFilters }: UseViewManagerOptions) {
  const queryClient = useQueryClient()
  const { user, hasPermission } = useAuth()
  const canManagePersonalViews = hasPermission("gridviews.personal.manage")
  const canManageCompanyDefaults = hasPermission("gridviews.manage")
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [localConfig, setLocalConfig] = useState<ViewConfig | null>(null)
  const [defaultApplied, setDefaultApplied] = useState(false)

  const queryKey = ["grid-views", gridType]

  const { data: allViews = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get<GridView[]>(`/gridviews?gridType=${encodeURIComponent(gridType)}`),
    staleTime: 30_000,
    retry: 1,
  })

  const views = useMemo(
    () =>
      allViews.filter((v) =>
        canManagePersonalViews
          ? v.userId === user?.id || v.isCompanyDefault
          : v.isCompanyDefault,
      ),
    [allViews, canManagePersonalViews, user?.id],
  )

  const activeView = useMemo(
    () => views.find((v) => v.id === activeViewId) ?? null,
    [views, activeViewId],
  )

  // Auto-select default view on initial load
  useEffect(() => {
    if (defaultApplied || isLoading) return

    // 1. Try user's personal default
    const userDefault = canManagePersonalViews
      ? views.find((v) => v.userId === user?.id && v.isDefault)
      : undefined
    if (userDefault) {
      setActiveViewId(userDefault.id)
      setLocalConfig(userDefault.config)
    }
    // 2. Try company default
    else {
      const companyDefault = views.find((v) => v.isCompanyDefault)
      if (companyDefault) {
        setActiveViewId(companyDefault.id)
        setLocalConfig(companyDefault.config)
      }
      // 3. Fall back to company settings filters
      else if (defaultHiddenFilters && defaultHiddenFilters.size > 0) {
        setLocalConfig({
          ...EMPTY_CONFIG,
          hiddenFilters: Array.from(defaultHiddenFilters),
        })
      }
    }

    setDefaultApplied(true)
  }, [views, isLoading, defaultApplied, defaultHiddenFilters, user?.id, canManagePersonalViews])

  const currentConfig: ViewConfig = useMemo(
    () => localConfig ?? EMPTY_CONFIG,
    [localConfig],
  )

  // Derived hidden set for FilterBar compatibility
  const hidden = useMemo(
    () => new Set(currentConfig.hiddenFilters),
    [currentConfig.hiddenFilters],
  )

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey }),
    [queryClient, queryKey],
  )

  const loadView = useCallback(
    (viewId: string) => {
      const view = views.find((v) => v.id === viewId)
      if (view) {
        setActiveViewId(view.id)
        setLocalConfig(view.config)
      }
    },
    [views],
  )

  const clearActiveView = useCallback(() => {
    setActiveViewId(null)
    if (defaultHiddenFilters && defaultHiddenFilters.size > 0) {
      setLocalConfig({
        ...EMPTY_CONFIG,
        hiddenFilters: Array.from(defaultHiddenFilters),
      })
    } else {
      setLocalConfig(null)
    }
  }, [defaultHiddenFilters])

  const saveView = useCallback(
    async (viewId: string, config: ViewConfig) => {
      const target = allViews.find((v) => v.id === viewId)
      if (!target) throw new Error("View not found")
      if (target.isCompanyDefault) {
        if (!canManageCompanyDefaults) throw new Error("Forbidden")
      } else if (!canManagePersonalViews) {
        throw new Error("Forbidden")
      }
      await api.put(`/gridviews/${viewId}`, { config })
      await invalidate()
    },
    [allViews, canManageCompanyDefaults, canManagePersonalViews, invalidate],
  )

  const saveAsNewView = useCallback(
    async (name: string, config: ViewConfig, isCompanyDefault = false): Promise<GridView> => {
      if (isCompanyDefault) {
        if (!canManageCompanyDefaults) throw new Error("Forbidden")
      } else if (!canManagePersonalViews) {
        throw new Error("Forbidden")
      }

      const view = await api.post<GridView>("/gridviews", {
        name,
        gridType,
        config,
        isDefault: false,
        isCompanyDefault,
      })
      await invalidate()
      setActiveViewId(view.id)
      setLocalConfig(view.config)
      return view
    },
    [gridType, canManageCompanyDefaults, canManagePersonalViews, invalidate],
  )

  const deleteView = useCallback(
    async (viewId: string) => {
      const target = allViews.find((v) => v.id === viewId)
      if (!target) throw new Error("View not found")
      if (target.isCompanyDefault) {
        if (!canManageCompanyDefaults) throw new Error("Forbidden")
      } else if (!canManagePersonalViews) {
        throw new Error("Forbidden")
      }

      await api.delete(`/gridviews/${viewId}`)
      if (activeViewId === viewId) {
        setActiveViewId(null)
        setLocalConfig(null)
      }
      await invalidate()
    },
    [activeViewId, allViews, canManageCompanyDefaults, canManagePersonalViews, invalidate],
  )

  const renameView = useCallback(
    async (viewId: string, name: string) => {
      const target = allViews.find((v) => v.id === viewId)
      if (!target) throw new Error("View not found")
      if (target.isCompanyDefault) {
        if (!canManageCompanyDefaults) throw new Error("Forbidden")
      } else if (!canManagePersonalViews) {
        throw new Error("Forbidden")
      }

      await api.put(`/gridviews/${viewId}`, { name })
      await invalidate()
    },
    [allViews, canManageCompanyDefaults, canManagePersonalViews, invalidate],
  )

  const setDefaultView = useCallback(
    async (viewId: string) => {
      if (!canManagePersonalViews) throw new Error("Forbidden")
      await api.put(`/gridviews/${viewId}`, { isDefault: true })
      await invalidate()
    },
    [canManagePersonalViews, invalidate],
  )

  const clearDefault = useCallback(
    async (viewId: string) => {
      if (!canManagePersonalViews) throw new Error("Forbidden")
      await api.put(`/gridviews/${viewId}`, { isDefault: false })
      await invalidate()
    },
    [canManagePersonalViews, invalidate],
  )

  // Filter toggle helpers (compatible with FilterBar)
  const toggleFilter = useCallback((id: string) => {
    setLocalConfig((prev) => {
      const cfg = prev ?? EMPTY_CONFIG
      const filters = new Set(cfg.hiddenFilters)
      filters.has(id) ? filters.delete(id) : filters.add(id)
      return { ...cfg, hiddenFilters: Array.from(filters) }
    })
  }, [])

  const toggleAllFilters = useCallback((ids: string[], hide: boolean) => {
    setLocalConfig((prev) => {
      const cfg = prev ?? EMPTY_CONFIG
      const filters = new Set(cfg.hiddenFilters)
      ids.forEach((id) => (hide ? filters.add(id) : filters.delete(id)))
      return { ...cfg, hiddenFilters: Array.from(filters) }
    })
  }, [])

  const clearFilters = useCallback(() => {
    setLocalConfig((prev) => {
      const cfg = prev ?? EMPTY_CONFIG
      return { ...cfg, hiddenFilters: [] }
    })
  }, [])

  // Row order
  const setRowOrder = useCallback((order: string[]) => {
    setLocalConfig((prev) => {
      const cfg = prev ?? EMPTY_CONFIG
      return { ...cfg, rowOrder: order }
    })
  }, [])

  // Column visibility
  const toggleColumn = useCallback((colId: string) => {
    setLocalConfig((prev) => {
      const cfg = prev ?? EMPTY_CONFIG
      const cols = new Set(cfg.hiddenColumns)
      cols.has(colId) ? cols.delete(colId) : cols.add(colId)
      return { ...cfg, hiddenColumns: Array.from(cols) }
    })
  }, [])

  // Check if local config differs from saved view
  const hasUnsavedChanges = useMemo(() => {
    if (!activeView || !localConfig) return false
    return JSON.stringify(activeView.config) !== JSON.stringify(localConfig)
  }, [activeView, localConfig])

  const ownViews = useMemo(
    () => allViews.filter((v) => v.userId === user?.id),
    [allViews, user?.id],
  )

  return {
    views,
    ownViews,
    activeView,
    isLoading,
    loadView,
    clearActiveView,
    saveView,
    saveAsNewView,
    deleteView,
    renameView,
    setDefaultView,
    clearDefault,
    currentConfig,
    hasUnsavedChanges,
    hidden,
    toggleFilter,
    toggleAllFilters,
    clearFilters,
    setRowOrder,
    toggleColumn,
    canManagePersonalViews,
    canManageCompanyDefaults,
  }
}

/** Sort rows by a saved order. Rows not in the order appear at the end in original order. */
export function applyRowOrder<T>(
  rows: T[],
  getKey: (row: T) => string,
  order: string[],
): T[] {
  if (!order.length) return rows
  const orderMap = new Map(order.map((key, i) => [key, i]))
  return [...rows].sort((a, b) => {
    const ai = orderMap.get(getKey(a)) ?? Infinity
    const bi = orderMap.get(getKey(b)) ?? Infinity
    if (ai === Infinity && bi === Infinity) return 0
    return ai - bi
  })
}
