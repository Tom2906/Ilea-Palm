import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface SaveViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string, isCompanyDefault: boolean) => Promise<void>
  canManagePersonalViews: boolean
  canManageCompanyDefaults: boolean
}

export function SaveViewDialog({
  open,
  onOpenChange,
  onSave,
  canManagePersonalViews,
  canManageCompanyDefaults,
}: SaveViewDialogProps) {
  const [name, setName] = useState("")
  const [isCompanyDefault, setIsCompanyDefault] = useState(!canManagePersonalViews && canManageCompanyDefaults)
  const [saving, setSaving] = useState(false)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setName("")
      setIsCompanyDefault(!canManagePersonalViews && canManageCompanyDefaults)
    }
  }, [open, canManagePersonalViews, canManageCompanyDefaults])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave(name.trim(), isCompanyDefault)
      setName("")
      setIsCompanyDefault(!canManagePersonalViews && canManageCompanyDefaults)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save View</DialogTitle>
          <DialogDescription>
            Enter a name for this view
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="view-name">Name</Label>
            <Input
              id="view-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My View"
              onKeyDown={(e) => e.key === "Enter" && name.trim() && handleSave()}
              autoFocus
            />
          </div>

          {canManageCompanyDefaults && (
            <div className="flex items-start space-x-2">
              <Checkbox
                id="company-default"
                checked={isCompanyDefault}
                disabled={!canManagePersonalViews}
                onCheckedChange={(checked) => setIsCompanyDefault(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="company-default"
                  className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Save as company default
                </label>
                <p className="text-xs text-muted-foreground">
                  This will be the default view for all users who haven't set their own
                </p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
