# Day in the Life Generator

## Status: Complete (pending testing)

## Overview
Chat-based AI feature that guides residential care workers through creating "Day in the Life" observations for children and young people. Focuses on relationship dynamics, emotional wellbeing, and PACE-informed reflective practice. Multi-turn conversation with structured prompts, streaming responses, permission-gated.

## Output Style
- Always uses "adult" (never "staff")
- Preserves direct quotes exactly (speech marks)
- PACE language (Playfulness, Acceptance, Curiosity, Empathy)
- Third-person narrative, natural voice (not robotic)
- Chronological flow with relationship observations woven in
- Reflective language: "appeared", "seemed", "demonstrated"

## Key Decisions
- AI abstraction: `Microsoft.Extensions.AI` (`IChatClient`) — provider-agnostic
- Streaming: Server-Sent Events (SSE) via raw fetch
- Conversation state: Browser-only (React state), stateless backend
- Sidebar placement: New "Tools" group between Management and Administration
- Permission: `day_in_life.use`

## Files Changed
- `work/day-in-life/migration.sql` — adds permission
- `EmployeeHub.Api/EmployeeHub.Api.csproj` — NuGet packages
- `EmployeeHub.Api/appsettings.json` — Ai config section
- `EmployeeHub.Api/Program.cs` — IChatClient DI registration
- `EmployeeHub.Api/Services/RoleService.cs` — permission key
- `EmployeeHub.Api/DTOs/DayInLifeDtos.cs` — request/response DTOs
- `EmployeeHub.Api/Controllers/DayInLifeController.cs` — SSE streaming endpoint
- `employee-hub-ui/src/lib/types.ts` — ChatMessage type
- `employee-hub-ui/src/pages/day-in-life.tsx` — chat page
- `employee-hub-ui/src/App.tsx` — route
- `employee-hub-ui/src/components/app-sidebar.tsx` — Tools group
- `employee-hub-ui/src/components/app-layout.tsx` — page title
- `employee-hub-ui/src/pages/roles.tsx` — Tools permission tab
