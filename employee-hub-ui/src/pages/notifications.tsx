import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { formatDate, formatDateTime } from "@/lib/format"
import type { PendingNotification, NotificationLogEntry, SendNotificationsResult } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ListRow } from "@/components/list-row"
import { Send } from "lucide-react"

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const [sendResult, setSendResult] = useState<SendNotificationsResult | null>(null)

  const { data: pending, isLoading: loadingPending } = useQuery({
    queryKey: ["notifications-pending"],
    queryFn: () => api.get<PendingNotification[]>("/notifications/pending"),
  })

  const { data: log, isLoading: loadingLog } = useQuery({
    queryKey: ["notifications-log"],
    queryFn: () => api.get<NotificationLogEntry[]>("/notifications/log?limit=100"),
  })

  const sendMutation = useMutation({
    mutationFn: () => api.post<SendNotificationsResult>("/notifications/send"),
    onSuccess: (result) => {
      setSendResult(result)
      queryClient.invalidateQueries({ queryKey: ["notifications-pending"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-log"] })
    },
  })

  return (
    <div className="space-y-4">
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pending?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="log">Notification Log</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Training expiring or expired that requires notification.
            </p>
            <Button
              size="sm"
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending || !pending?.length}
            >
              <Send className="h-4 w-4 mr-1" />
              {sendMutation.isPending ? "Sending..." : "Send Notifications"}
            </Button>
          </div>

          {sendResult && (
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm space-y-1">
                  <p>Emails sent: <strong>{sendResult.emailsSent}</strong></p>
                  <p>Skipped (already sent): <strong>{sendResult.skipped}</strong></p>
                  {sendResult.errors.length > 0 && (
                    <div className="text-destructive">
                      Errors: {sendResult.errors.join(", ")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {loadingPending ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : pending?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No pending notifications. All training is current.
            </p>
          ) : (
            <div className="space-y-2">
              {pending?.map((p) => (
                <ListRow key={`${p.employeeId}-${p.courseId}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{p.employeeName}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>{p.courseName}</span>
                      <span>{p.expiryDate ? `Expires: ${formatDate(p.expiryDate)}` : "No expiry"}</span>
                      {p.daysUntilExpiry !== null && (
                        <span>
                          {p.daysUntilExpiry < 0
                            ? `${Math.abs(p.daysUntilExpiry)}d overdue`
                            : `${p.daysUntilExpiry}d remaining`}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{p.category}</Badge>
                  <StatusBadge status={p.status} />
                  <div className="flex gap-1 shrink-0">
                    {p.notifyEmployee && <Badge variant="secondary" className="text-xs">Emp</Badge>}
                    {p.notifyAdmin && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                  </div>
                </ListRow>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="log">
          {loadingLog ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : log?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notifications have been sent yet.
            </p>
          ) : (
            <div className="space-y-2">
              {log?.map((entry) => (
                <ListRow key={entry.id}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {entry.employeeName ?? "-"} — {entry.courseName ?? "-"}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>{formatDateTime(entry.sentAt)}</span>
                      <span>{entry.recipientEmail}</span>
                      <Badge variant="secondary" className="text-xs">
                        {entry.recipientType}
                      </Badge>
                    </div>
                  </div>
                  <Badge
                    variant={entry.notificationType === "expired" ? "destructive" : "default"}
                    className={`text-xs shrink-0 ${
                      entry.notificationType === "expiry_warning"
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : ""
                    }`}
                  >
                    {entry.notificationType === "expiry_warning" ? "Warning" : "Expired"}
                  </Badge>
                </ListRow>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
