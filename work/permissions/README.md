# Role-Based Permission System

## Status: Complete (pending migration run + testing)

## Overview
Replace hardcoded 3-role system with configurable role-permission system.

## Key Files
- `work/permissions/migration.sql` — Database migration
- `work/permissions/plan.md` — Full implementation plan (see plan mode transcript)

## Changes
- New tables: `roles`, `role_permissions`
- Users table: `role` text column → `role_id` UUID FK
- JWT embeds permissions + data scope as claims
- Backend: `HasPermission()` / `GetDataScope()` replace `IsAdmin()` / `IsManager()`
- Frontend: `hasPermission()` / `dataScope` replace `isAdmin` / `isManager`
- New pages: `/roles`, `/users`
