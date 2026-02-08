# Day in the Life / Document Assistant - Backlog

## Current State (Implemented)

### What works now:
- `/api/day-in-life/chat` endpoint for AI-powered document generation
- Hardcoded system prompt for Day in the Life observations
- AI configuration UI in Settings page (provider, model, API key)
- Supports 3 providers: Anthropic (Claude), OpenAI (GPT), Gemini (Google)
- AI config stored in database (`company_settings` table)
- Test connection button to verify AI setup
- SSE streaming for real-time response
- Permission-gated: `day_in_life.use`
- "Tools" sidebar group in UI

### Current architecture:
- **Controller:** `DayInLifeController` (specific to Day in the Life)
- **Endpoint:** `POST /api/day-in-life/chat`
- **System prompt:** Hardcoded for residential care Day in the Life observations
- **Flow:** User dumps rough notes → AI expands into polished PACE-informed narrative

## Future Refactoring: Generic Document Assistant

### Goal:
Transform from single-purpose (Day in Life) to multi-purpose document assistant supporting various document types.

### Proposed changes:

#### Backend:
1. **Rename controller** from `DayInLifeController` to `DocumentAssistantController` or `ChatController`
2. **Update endpoint** from `/api/day-in-life/chat` to `/api/chat`
3. **Add behavior parameter** to `ChatRequest`:
   ```csharp
   public class ChatRequest
   {
       public string Behavior { get; set; } = "day-in-life"; // "incident-report", "supervision-notes", etc.
       public List<ChatMessageDto> Messages { get; set; } = new();
       public string? ChildName { get; set; }
   }
   ```
4. **System prompt mapping** — dictionary of behaviors to prompts:
   ```csharp
   private static readonly Dictionary<string, string> SystemPrompts = new()
   {
       ["day-in-life"] = "...", // current prompt
       ["incident-report"] = "...", // future
       ["supervision-notes"] = "...", // future
   };
   ```
5. **Dynamic prompt selection** based on `request.Behavior`

#### Frontend:
1. **Update API calls** to send `behavior` parameter (default to `"day-in-life"` for now)
2. **Future enhancement:** Dropdown in UI to select document type before starting conversation

#### Database:
- No changes needed — AI config already supports any behavior

### Benefits:
- One endpoint, multiple document types
- Easy to add new behaviors (just add new system prompt)
- Shared AI configuration across all document types
- Extensible for future needs (incident reports, handover notes, etc.)

### Implementation effort:
- **Estimated time:** 30-45 minutes
- **Risk:** Low (mostly renaming + adding behavior parameter)
- **Breaking changes:** Yes (endpoint URL changes, requires frontend update)

## Priority
**Deferred** — Current single-purpose implementation meets immediate needs. Refactor when second document type is needed.
