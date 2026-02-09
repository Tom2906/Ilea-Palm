# Day in the Life - AI Document Assistant

## Status: Complete ✅

## Summary
Chat-based AI feature for generating professional "Day in the Life" observations for children in residential care. Multi-turn conversation with PACE-informed system prompt, SSE streaming, voice capture, and multi-provider AI support.

## Completed Features
- ✅ Chat interface with SSE streaming (Feb 8)
- ✅ AI provider management - Anthropic, OpenAI, Gemini (Feb 8)
- ✅ Database-stored provider configurations (Feb 8)
- ✅ Dynamic model selection with API fetching (Feb 8)
- ✅ Custom system prompt configuration (Feb 8)
- ✅ Voice capture with push-to-talk (Feb 9)
- ✅ Mobile and desktop browser support (Feb 9)
- ✅ Streaming error handling and state management (Feb 9)
- ✅ Settings integration (AI Providers + Day in Life tabs)
- ✅ Permission-gated (`day_in_life.use`)

## Architecture

### Backend
- **Controller:** `DayInLifeController.cs` - SSE streaming endpoint
- **Services:** `AIProviderService.cs` - provider CRUD + model fetching
- **AI Integration:** `Microsoft.Extensions.AI` (IChatClient abstraction)
- **Supported Providers:** Anthropic (Claude), OpenAI (GPT), Gemini (Google)

### Frontend
- **Chat Page:** `src/pages/day-in-life.tsx` - chat UI + voice capture
- **Settings:** `src/pages/settings.tsx` - provider management + configuration
- **Voice:** Web Speech API (push-to-talk, browser-native)
- **State:** Browser-only (React state), no persistence

### Database
- **ai_providers** - Provider configurations (name, API key, active status)
- **company_settings.day_in_life_provider_id** - Selected provider
- **company_settings.day_in_life_model** - Selected model
- **company_settings.day_in_life_system_prompt** - Custom prompt

## Deployment

### Database Migration
1. Run `migration.sql` - adds `day_in_life.use` permission
2. Run `ai-providers-table-migration.sql` - creates tables and migrates existing config

### Configuration
1. Settings → AI Providers - Add provider with API key
2. Settings → Day in the Life - Select provider/model, customize prompt
3. Assign `day_in_life.use` permission to roles in Roles page

## Files

### Backend
- Controllers/DayInLifeController.cs
- Services/AIProviderService.cs + interface
- Services/RoleService.cs (permission key)
- DTOs/DayInLifeDtos.cs
- Models/AIProvider.cs

### Frontend
- pages/day-in-life.tsx (chat interface + voice)
- pages/settings.tsx (AI config tabs)
- components/app-sidebar.tsx (Tools group)
- lib/types.ts (ChatMessage, AIProvider, AIModel)

### Database
- migration.sql (permission)
- ai-providers-table-migration.sql (final schema)

## Usage
1. Navigate to Tools → Day in the Life
2. Type messages OR hold mic button to speak
3. AI guides through conversation
4. Final document marked "--- FINAL DOCUMENT ---"
5. Copy to clipboard

## Future (see backlog.md)
- Generic document assistant (incident reports, supervision notes)
- Conversation persistence
- Document templates library