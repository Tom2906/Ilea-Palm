# Setup Guide: n8n Training Expiry Notifications

## Prerequisites

- n8n running at http://localhost:5678
- Supabase project URL and service role key
- Gmail account with App Password for SMTP
- Stage 10 migration applied (see below)

---

## Step 0: Run the Database Migration

Run `work/initial-build/stage10/migration.sql` in the Supabase SQL Editor. This:

1. Adds `reminder_frequency_days` column to `training_courses` (default: 7 days)
2. Creates the `pending_notifications` view — returns exactly the notifications that need sending

The view handles all the logic: joins training data, resolves employee + admin recipients, checks notification_log for recent sends, respects the per-course reminder frequency.

---

## Step 1: Create Supabase Credential in n8n

1. Open n8n → **Settings** → **Credentials** → **Add Credential**
2. Search for **Supabase** and select it
3. Fill in:

| Field | Value |
|-------|-------|
| Host | `https://iwycjvbmifcirnyknnlu.supabase.co` |
| Service Role Secret | *(from appsettings.json → Supabase:ServiceRoleKey)* |

4. Click **Test** to verify
5. Name it **Supabase** and save

---

## Step 2: Create Gmail SMTP Credential in n8n

### 2a: Generate a Gmail App Password

1. Go to https://myaccount.google.com/apppasswords
2. You need 2-Step Verification enabled on the Google account
3. Select **Mail** as the app, **Windows Computer** as the device
4. Click **Generate** — copy the 16-character password

### 2b: Add SMTP Credential in n8n

1. In n8n → **Credentials** → **Add Credential**
2. Search for **SMTP** and select it
3. Fill in:

| Field | Value |
|-------|-------|
| Host | `smtp.gmail.com` |
| Port | `465` |
| SSL/TLS | **true** |
| User | `your-gmail@gmail.com` |
| Password | *(the 16-character App Password from step 2a)* |

4. Click **Test** to verify
5. Name it **Gmail SMTP** and save

---

## Step 3: Import the Workflow

1. In n8n, go to **Workflows** → **Import from file**
2. Select `training-expiry-workflow.json` from this directory

### 3a: Connect Credentials to Nodes

The imported workflow has placeholder credential IDs. Assign your credentials:

1. **Double-click "Get Pending Notifications"** → select your **Supabase** credential
2. **Double-click "Send Email"** → select your **Gmail SMTP** credential
3. **Double-click "Log to notification_log"** → select your **Supabase** credential
4. Save the workflow

---

## Step 4: Test

### 4a: Test the View

Click the **"Get Pending Notifications"** node → **Test step**. Verify it returns rows with:
- `recipient_email`, `first_name`, `last_name`, `course_name`, `status`, `days_until_expiry`
- `recipient_type` (employee or admin)
- `notification_type` (expired or expiry_warning)

If 0 rows: either no training is expiring/expired, or all have been notified within the reminder frequency window.

### 4b: Test Full Workflow

Click **Test workflow**. Check:
- Email arrives at the recipient
- A row appears in `notification_log` (visible in the app's Notification Log tab)

### 4c: Test Reminder Frequency

Run the workflow again immediately. The view should return 0 rows for previously notified records (because notification_log now has entries within the `reminder_frequency_days` window).

---

## Step 5: Activate

Toggle the workflow to **Active** (top-right switch). It runs daily at 8am.

---

## Workflow Nodes

```
Daily 8am Trigger
  → Supabase: Get All from pending_notifications (no filters — the view handles everything)
    → Send Email (n8n expressions build subject/body from row fields)
      → Supabase: Create row in notification_log
```

4 nodes. All Supabase nodes. No raw SQL in the workflow. No JavaScript.

---

## Adjusting Reminder Frequency

Per-course setting in `training_courses.reminder_frequency_days`:
- Default: 7 (weekly reminders)
- Set to 1 for daily reminders
- Set to 30 for monthly reminders

Change via the app's course management or directly in Supabase.

---

## Troubleshooting

**View returns empty but training is expiring:**
- Query `training_status` directly — does it show 'Expiring Soon' or 'Expired' rows?
- Check if `training_record_id` is NULL (no training record for that employee+course)
- Check if `notify_employee` / `notify_admin` are both false on the course
- Check `notification_log` — was the notification sent within `reminder_frequency_days`?

**Supabase node returns empty:**
- Verify the credential uses the **service role key** (not the anon key)
- Confirm the `pending_notifications` view exists (run stage 10 migration)

**Email fails:**
- Verify Gmail SMTP credential (test it in n8n)
- Confirm App Password is correct and 2-Step Verification is enabled

**Manual "Send Notifications" in the app still works:**
- Unchanged — the app's NotificationService.cs has its own logic
- Both write to the same `notification_log` table, sharing the audit trail
