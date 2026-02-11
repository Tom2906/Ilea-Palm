import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutGrid, Save, ChevronDown, Settings, Star, Building2 } from "lucide-react"
import type { GridView, ViewConfig } from "@/lib/types"
import { SaveViewDialog } from "./save-view-dialog"
import { ManageViewsDialog } from "./manage-views-dialog"
import { useAuth } from "@/contexts/auth-context"

interface ViewToolbarProps {
  views: GridView[]
  activeView: GridView | null
  hasUnsavedChanges: boolean
  currentConfig: ViewConfig
  onLoadView: (viewId: string) => void
  onClearActiveView: () => void
  onSave: (viewId: string, config: ViewConfig) => Promise<void>
  onSaveAs: (name: string, config: ViewConfig, isCompanyDefault: boolean) => Promise<GridView>
  onDelete: (viewId: string) => Promise<void>
  onRename: (viewId: string, name: string) => Promise<void>
  onSetDefault: (viewId: string) => Promise<void>
  onClearDefault: (viewId: string) => Promise<void>
  canManagePersonalViews: boolean
  canManageCompanyDefaults: boolean
  children?: React.ReactNode
}

export function ViewToolbar({
  views,
  activeView,
  hasUnsavedChanges,
  currentConfig,
  onLoadView,
  onClearActiveView,
  onSave,
  onSaveAs,
  onDelete,
  onRename,
  onSetDefault,
  onClearDefault,
  canManagePersonalViews,
  canManageCompanyDefaults,
  children,
}: ViewToolbarProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [manageDialogOpen, setManageDialogOpen] = useState(false)
  const { user } = useAuth()
  const canManageAnyViews = canManagePersonalViews || canManageCompanyDefaults
  const manageableViews = useMemo(
    () => views.filter((view) =>
      (view.isCompanyDefault && canManageCompanyDefaults)
      || (!view.isCompanyDefault && view.userId === user?.id && canManagePersonalViews),
    ),
    [views, user?.id, canManagePersonalViews, canManageCompanyDefaults],
  )
  const canSaveActiveView = !!activeView
    && hasUnsavedChanges
    && (
      activeView.isCompanyDefault
        ? canManageCompanyDefaults
        : (activeView.userId === user?.id && canManagePersonalViews)
    )

  const handleSave = async () => {
    if (activeView) {
      await onSave(activeView.id, currentConfig)
    }
  }

  const handleSaveAs = async (name: string, isCompanyDefault: boolean) => {
    await onSaveAs(name, currentConfig, isCompanyDefault)
  }

  return (
    <div className="flex items-center gap-1.5">
      {children}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-2 text-xs gap-1">
            <LayoutGrid className="h-3.5 w-3.5" />
            {activeView ? (
              <span className="max-w-[100px] truncate">{activeView.name}</span>
            ) : (
              "Views"
            )}
            {hasUnsavedChanges && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {views.length > 0 && (
            <>
              {views.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  onClick={() => onLoadView(view.id)}
                  className="gap-2"
                >
                  {view.isDefault && view.userId === user?.id && (
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  )}
                  {view.isCompanyDefault && (
                    <Building2 className="h-3 w-3 text-blue-500" />
                  )}
                  <span className="truncate flex-1">{view.name}</span>
                  {activeView?.id === view.id && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
          {activeView && (
            <DropdownMenuItem onClick={() => onClearActiveView()}>
              Reset to defaults
            </DropdownMenuItem>
          )}
          {canSaveActiveView && (
            <DropdownMenuItem onClick={handleSave} className="gap-2">
              <Save className="h-3.5 w-3.5" />
              Save "{activeView.name}"
            </DropdownMenuItem>
          )}
          {canManageAnyViews && (
            <DropdownMenuItem onClick={() => setSaveDialogOpen(true)} className="gap-2">
              <Save className="h-3.5 w-3.5" />
              Save as new view
            </DropdownMenuItem>
          )}
          {manageableViews.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setManageDialogOpen(true)}
                className="gap-2"
              >
                <Settings className="h-3.5 w-3.5" />
                Manage views
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <SaveViewDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveAs}
        canManagePersonalViews={canManagePersonalViews}
        canManageCompanyDefaults={canManageCompanyDefaults}
      />

      <ManageViewsDialog
        open={manageDialogOpen}
        onOpenChange={setManageDialogOpen}
        views={manageableViews}
        onRename={onRename}
        onDelete={onDelete}
        onSetDefault={onSetDefault}
        onClearDefault={onClearDefault}
      />
    </div>
  )
}
