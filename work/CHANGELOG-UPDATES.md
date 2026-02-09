# Changelog Updates - February 2026

Add these entries to `changelog.xlsx`:

## February 9, 2026

### Voice Capture for Day in the Life
**Type:** Feature Enhancement
**Description:** Added voice capture with push-to-talk for Day in the Life feature. Users can hold microphone button to speak, with real-time transcript preview.
**Impact:** Mobile and desktop users can now use voice input instead of typing
**Files:** employee-hub-ui/src/pages/day-in-life.tsx
**Commit:** 1b0fa83

### Dashboard Mobile Scrolling Fix
**Type:** Bug Fix
**Description:** Fixed dashboard scrolling on mobile devices by removing height constraints
**Impact:** Both personal and company dashboards now scroll properly on mobile
**Files:** employee-hub-ui/src/pages/my-dashboard.tsx, dashboard.tsx
**Commit:** f64436c

### Day in the Life Error Handling
**Type:** Bug Fix
**Description:** Fixed streaming issues - infinite "thinking", send button not activating, configuration errors
**Impact:** Improved reliability and error messages
**Files:** employee-hub-ui/src/pages/day-in-life.tsx, EmployeeHub.Api/Controllers/DayInLifeController.cs
**Commit:** 1139c5a

## February 8, 2026

### AI Providers Management UI
**Type:** Feature Enhancement
**Description:** Moved AI Providers management into Settings page as a tab, using ListRow component for compact display
**Impact:** Cleaner navigation, consistent UI patterns
**Files:** employee-hub-ui/src/pages/settings.tsx, app-sidebar.tsx, App.tsx
**Commits:** 3fef972, 10f1779

### AI Providers Table Architecture
**Type:** Feature
**Description:** Refactored AI configuration to use ai_providers table with proper CRUD operations and real-time model fetching from provider APIs
**Impact:** Supports multiple provider configurations, dynamic model selection, Gemini model API integration
**Database:** ai_providers table, company_settings columns (day_in_life_provider_id, day_in_life_model)
**Files:** EmployeeHub.Api/Services/AIProviderService.cs, Controllers/AIProvidersController.cs, Models/AIProvider.cs
**Commits:** 28721b3, ace3aed, 334082a
**Migration:** work/day-in-life/ai-providers-table-migration.sql

### Day in the Life Feature (Initial Release)
**Type:** Feature
**Description:** AI-powered chat interface for generating professional "Day in the Life" observations for children in residential care
**Impact:** Care staff can use AI to transform rough notes into polished, PACE-informed narratives
**Providers:** Anthropic (Claude), OpenAI (GPT), Google (Gemini)
**Permission:** day_in_life.use
**Sidebar:** New "Tools" group
**Database:** Permission + configuration columns
**Files:**
- Backend: Controllers/DayInLifeController.cs, DTOs/DayInLifeDtos.cs
- Frontend: pages/day-in-life.tsx, pages/settings.tsx (Day in Life tab)
**Migration:** work/day-in-life/migration.sql
**Docs:** work/day-in-life/README.md, backlog.md, DEPLOYMENT.md

## February 7, 2026

### Dashboard Enhancements
**Type:** Feature Enhancement
**Description:** Enhanced company and personal dashboards with comprehensive data visibility
**Features:**
- Company Dashboard: Permission-gated stat cards, tabbed detail view (Overview/Supervision/Appraisals/Leave/Hours), unified alerts, activity feed
- Personal Dashboard: Supervision/appraisal/hours stat cards, upcoming shifts widget, expanded notifications, activity feed
**Impact:** All features now surfaced in dashboards for better data visibility
**Files:**
- Shared: src/lib/shift-colors.ts, audit-messages.ts, format.ts (formatRelativeTime)
- Components: activity-feed.tsx, upcoming-shifts.tsx
- Pages: dashboard.tsx, my-dashboard.tsx, dashboard-overview.tsx
**Archived:** work/archive/2026-02/dashboards/

---

## Archive Summary

**Archived work:**
- ✅ work/dashboards → archive/2026-02/dashboards/
- ✅ work/day-in-life/old-migrations → archive/2026-02/day-in-life/old-migrations/
- ✅ work/rotas/Rota 2026.xlsx → archive/2026-02/rotas/

**Active work:**
- work/day-in-life/ (completed, keeping for reference + backlog)
- work/microsoft-auth/ (in progress)
