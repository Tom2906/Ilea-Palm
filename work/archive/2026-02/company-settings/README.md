# Company Settings & Expiry Warning Days

## Status: COMPLETE (2026-02-05) — Migrations run, settings page working with 3 tabs (Company/Training/Supervision), default hidden filters applied on matrices.

## Summary

Added company-level settings table and separated "expiry warning" (UI) from "notification" (email) timing for training courses.

## Changes

### Database
- New `company_settings` table with defaults for training and supervision
- New `expiry_warning_days_before` column on `training_courses`
- Updated `training_status` view to use `expiry_warning_days_before` for "Expiring Soon" status

### Backend
- `CompanySettings` model
- `CompanySettingsService` and `ICompanySettingsService`
- `CompanySettingsController` with GET and PUT endpoints
- Updated `TrainingCourse` model and DTOs with `ExpiryWarningDaysBefore`
- Updated `TrainingCourseService` to handle new field

### Frontend
- Updated `TrainingCourse` type with `expiryWarningDaysBefore`
- New `CompanySettings` type
- Updated training courses page form with both fields
- Display shows "Xd warning" and "Xd notification" separately

## Migration

Run `migration.sql` in Supabase SQL Editor:
1. Creates `company_settings` table with initial row
2. Adds `expiry_warning_days_before` to `training_courses`
3. Copies existing `notification_days_before` values to new field
4. Recreates `training_status` view using new field

## Defaults

- `default_expiry_warning_days`: 30 (UI shows amber 30 days before expiry)
- `default_notification_days_before`: 0 (emails only when actually expired)

## API Endpoints

- `GET /api/companysettings` - Get current settings
- `PUT /api/companysettings` - Update settings (admin only)
