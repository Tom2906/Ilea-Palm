# Day in the Life - Deployment Steps

## Prerequisites
- Supabase database access
- AI API key (Anthropic, OpenAI, or Gemini)

## Step 1: Database Migration

Run both migration SQL files against your Supabase database:

### 1a. Add permission to roles
```sql
-- File: work/day-in-life/migration.sql
-- Grants day_in_life.use permission to Administrator role
```

Run this file in the Supabase SQL Editor.

### 1b. Add AI config columns to company_settings
```sql
-- File: work/day-in-life/ai-config-migration.sql
-- Adds ai_provider, ai_model, ai_api_key columns
```

Run this file in the Supabase SQL Editor.

**Verify:** Check that the `role_permissions` table has a row with `permission = 'day_in_life.use'` and `company_settings` has the new AI columns.

---

## Step 2: Get an AI API Key

Choose one provider and get an API key:

### Option A: Gemini (Free tier - recommended for testing)
1. Go to https://aistudio.google.com/apikey
2. Create a new API key
3. Note it down (you'll enter it in Step 4)

**Free tier:** ~15 requests/minute, 1,500 requests/day

### Option B: Anthropic (Claude)
1. Go to https://console.anthropic.com/
2. Create account and add payment method
3. Create an API key
4. Note it down

**Cost:** Haiku ~$0.003/document, Sonnet ~$0.05/document

### Option C: OpenAI (GPT)
1. Go to https://platform.openai.com/
2. Create account and add payment method
3. Create an API key
4. Note it down

**Cost:** GPT-4o-mini ~$0.01/document

---

## Step 3: Restart the API

The backend code is already deployed. Just restart the API:

```bash
# Stop the running API (if running)
# Then start it again
cd EmployeeHub.Api
dotnet run
```

**Verify:** API starts without errors. Check that `/api/health` returns healthy status.

---

## Step 4: Configure AI in the UI

1. Log in to Employee Hub with an account that has `settings.manage` permission (Administrator role)
2. Navigate to **Settings** page
3. Click the **AI Configuration** tab
4. Fill in the form:
   - **AI Provider:** Select your chosen provider (Anthropic, OpenAI, or Gemini)
   - **Model Name:**
     - Anthropic: `claude-haiku-4-5-20250929` (cheap) or `claude-sonnet-4-5-20250929` (better quality)
     - OpenAI: `gpt-4o-mini`
     - Gemini: `gemini-2.0-flash`
   - **API Key:** Paste your API key from Step 2
5. Click **Save Changes**
6. Click **Test Connection** button
7. **Verify:** You should see "Connection successful" with a test response

---

## Step 5: Grant Permission to Users

1. Navigate to **Roles** page
2. Edit the roles that should have access to Day in the Life
3. Go to the **Tools** tab
4. Check the **Access** checkbox for "Day in the Life"
5. Save the role

**Verify:** Users with that role should now see "Day in the Life" in the "Tools" sidebar group.

---

## Step 6: Test the Feature

1. Log in as a user with `day_in_life.use` permission
2. Click **Day in the Life** in the Tools sidebar
3. The AI should greet you and ask for the young person's name and rough notes
4. Paste rough notes (or test with: "Blake woke up happy, had breakfast with Charlotte, went to the park")
5. The AI should stream back a polished, PACE-informed narrative
6. Verify the output uses "adult" (not "staff"), preserves quotes, and sounds natural

---

## Troubleshooting

### "AI is not configured" error
- Check Settings → AI Configuration tab
- Ensure provider, model, and API key are all filled in
- Click Test Connection to verify

### "Connection failed" on test
- **Anthropic:** Check API key is valid at https://console.anthropic.com/
- **OpenAI:** Check API key is valid at https://platform.openai.com/
- **Gemini:** Check API key is valid at https://aistudio.google.com/
- Verify you have sufficient credits/quota

### "You do not have permission"
- Check the user's role has `day_in_life.use` permission
- Go to Roles page → Select the role → Tools tab → Check "Day in the Life" Access

### Sidebar item doesn't appear
- Check the user has `day_in_life.use` permission in their role
- Refresh the page / log out and back in

---

## Cost Monitoring

### Gemini (Free tier)
- Monitor usage at https://aistudio.google.com/
- Free tier limits: 1,500 requests/day
- If you hit limits, wait until next day or upgrade

### Anthropic/OpenAI (Paid)
- Set up billing alerts in your provider console
- Monitor usage regularly
- Typical Day in Life document: 1,500-2,500 tokens output
- Haiku/gpt-4o-mini: <$0.01 per document
- Sonnet/gpt-4o: ~$0.05 per document

---

## Files Modified

### Backend
- `EmployeeHub.Api/Models/CompanySettings.cs` — added AI fields
- `EmployeeHub.Api/Services/ICompanySettingsService.cs` — added AI to request DTO
- `EmployeeHub.Api/Services/CompanySettingsService.cs` — added AI to SQL queries
- `EmployeeHub.Api/Services/RoleService.cs` — added `day_in_life.use` permission
- `EmployeeHub.Api/Controllers/DayInLifeController.cs` — chat + test endpoints
- `EmployeeHub.Api/DTOs/DayInLifeDtos.cs` — ChatRequest/ChatMessageDto

### Frontend
- `employee-hub-ui/src/lib/types.ts` — added AI fields to CompanySettings, ChatMessage type
- `employee-hub-ui/src/pages/settings.tsx` — added AI Configuration tab
- `employee-hub-ui/src/pages/day-in-life.tsx` — chat UI component
- `employee-hub-ui/src/App.tsx` — added /day-in-life route
- `employee-hub-ui/src/components/app-sidebar.tsx` — added Tools group
- `employee-hub-ui/src/components/app-layout.tsx` — added page title
- `employee-hub-ui/src/pages/roles.tsx` — added Tools permission tab

### Database
- `work/day-in-life/migration.sql` — permission grant
- `work/day-in-life/ai-config-migration.sql` — company_settings columns
