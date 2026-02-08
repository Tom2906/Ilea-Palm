# Microsoft Authentication - JIT Provisioning & Auth Method

## Status: In Progress — Core flow working, needs further testing

## Summary
Microsoft Entra ID SSO via MSAL redirect flow, JIT user provisioning, auth_method enforcement, and automatic employee matching by email.

## What Works
- Microsoft login via redirect flow (loginRedirect, not popup)
- JIT user creation with Employee role on first Microsoft login
- Auto-match employee records by email during JIT and on subsequent logins
- auth_method column enforces login method per user (password/microsoft/both)
- Users page shows auth method badge, controls for create/edit
- StrictMode double-init fix with ref guard

## Still Needs Testing
- Employee auto-matching (delete JIT user and re-login, or log in again to trigger retroactive match)
- auth_method enforcement (password-only user blocked from Microsoft, microsoft-only blocked from password)
- JIT provisioning for users without matching employee records
- Users page auth method create/edit flows
- Production deployment (redirect URI registration for production URL)

## Database Migration
Run `migration.sql` against Supabase — adds auth_method column, makes password_hash nullable, renames Staff→Employee role.

## Azure Config Required
- App Registration: SPA redirect URI must include production URL
- Current: `http://localhost:5173` registered
- Env vars: VITE_AZURE_CLIENT_ID, VITE_AZURE_TENANT_ID (frontend), AzureAd:ClientId/TenantId (backend)
