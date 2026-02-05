# n8n Training Expiry Notifications

**Status:** COMPLETE (2026-02-04) — Two workflows operational:
- Individual employee notifications
- Admin digest (single email with all expiring training)

## Overview

Automated email notifications for expiring/expired training records. Course settings (notification window, reminder frequency) are configurable per-course in the app UI.

## Files

| File | Purpose |
|------|---------|
| `training-expiry-workflow.json` | n8n workflow — import into n8n UI |
| `setup.md` | Step-by-step setup instructions |
| `../initial-build/stage10/migration.sql` | DB migration: `reminder_frequency_days` column + original `pending_notifications` view |
| `../initial-build/stage11/migration.sql` | **NEW — NOT YET RUN.** Rewrites `pending_notifications` view (see below) |

## What's Done

### App UI — `reminder_frequency_days` field (COMPLETE)
Added across all layers — model, DTOs, service, controller, TypeScript type, React form.

**Files changed:**
- `EmployeeHub.Api/Models/TrainingCourse.cs` — new property, default 7
- `EmployeeHub.Api/DTOs/TrainingCourseDtos.cs` — added to Create/Update/Response DTOs
- `EmployeeHub.Api/Services/TrainingCourseService.cs` — all SQL queries + ReadCourse indexes updated
- `EmployeeHub.Api/Controllers/TrainingCoursesController.cs` — MapToResponse
- `employee-hub-ui/src/lib/types.ts` — TrainingCourse interface
- `employee-hub-ui/src/pages/training-courses.tsx` — form field "Reminder Frequency (Days)"

### Clear Notification Log (COMPLETE)
Added for testing — allows re-triggering notifications by clearing the dedup log.

**Files changed:**
- `EmployeeHub.Api/Services/INotificationService.cs` — added `ClearLogAsync()`
- `EmployeeHub.Api/Services/NotificationService.cs` — `DELETE FROM notification_log`
- `EmployeeHub.Api/Controllers/NotificationsController.cs` — `DELETE /api/notifications/log`
- `employee-hub-ui/src/pages/notifications.tsx` — red "Clear Log" button on Log tab

### Stage 10 Migration (ALREADY RUN)
- `reminder_frequency_days` column added to `training_courses` (default 7)
- Original `pending_notifications` view created (depends on `training_status` view)

## What's NOT Done

### Stage 11 Migration — FIX `pending_notifications` view (NOT YET RUN)
The current `pending_notifications` view depends on the `training_status` view's status values to decide who gets notified. This is wrong — it means `notification_days_before` doesn't actually control the notification window properly. Items expired beyond the window still show up as pending.

**The fix (stage11):** Rewrite `pending_notifications` to use simple date math directly against `training_records`, no dependency on `training_status`:
- `tr.expiry_date <= CURRENT_DATE + notification_days_before days` — start reminding X days before expiry
- Dedup via `reminder_frequency_days` as before

**OPEN QUESTION:** Should there be an upper cutoff to STOP notifying after X days past expiry? Currently stage11 will keep notifying forever once something is expired (as long as it was within the window at some point). Options:
1. Add `AND tr.expiry_date >= CURRENT_DATE - (tc.notification_days_before || ' days')::INTERVAL` — stop after same window past expiry
2. No cutoff — keep reminding until someone renews the training
3. Separate configurable field for post-expiry cutoff

### n8n Workflow Setup
- Workflow JSON exists but n8n hasn't been set up yet
- See `setup.md` for instructions

## Architecture

```
Database (Supabase)                    n8n Workflow
---------------------                  ------------------
pending_notifications view   ──────>   Supabase: Get All
  ├─ training_records                  ──────>  Send Email
  ├─ employees                         ──────>  Supabase: Create (notification_log)
  ├─ training_courses
  ├─ users (admin emails)
  └─ notification_log (dedup)
```

The app also has its own send/log flow via `POST /api/notifications/send` for manual triggering from the UI.
