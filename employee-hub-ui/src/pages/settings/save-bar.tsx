import { Button } from "@/components/ui/button"

export function SaveBar({ dirty, pending, onReset }: { dirty: boolean; pending: boolean; onReset: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      {dirty && (
        <Button type="button" variant="outline" onClick={onReset} disabled={pending}>
          Reset
        </Button>
      )}
      <Button type="submit" disabled={pending || !dirty}>
        {pending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}
