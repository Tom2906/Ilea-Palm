using EmployeeHub.Api.Models;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class CompanySettingsService : ICompanySettingsService
{
    private readonly IDbService _db;
    private readonly IAuditService _audit;

    public CompanySettingsService(IDbService db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<CompanySettings> GetAsync()
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT id, company_name, default_expiry_warning_days, default_notification_days_before,
                   default_reminder_frequency_days, default_notify_employee, default_notify_admin,
                   default_supervision_frequency_months, supervision_months_back, supervision_months_forward,
                   default_hidden_roles, default_hidden_employee_statuses,
                   default_hidden_rota_roles, default_hidden_rota_employee_statuses,
                   appraisal_reviews_back, appraisal_reviews_forward,
                   ai_provider, ai_model, ai_api_key, anthropic_api_key, openai_api_key, gemini_api_key,
                   day_in_life_provider_id, day_in_life_model, day_in_life_system_prompt,
                   created_at, updated_at
            FROM company_settings
            LIMIT 1", conn);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return ReadSettings(reader);
        }

        // Return defaults if no row exists
        return new CompanySettings();
    }

    public async Task<CompanySettings> UpdateAsync(UpdateCompanySettingsRequest request, Guid userId)
    {
        var existing = await GetAsync();

        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            UPDATE company_settings SET
                company_name = COALESCE(@companyName, company_name),
                default_expiry_warning_days = COALESCE(@expiryWarningDays, default_expiry_warning_days),
                default_notification_days_before = COALESCE(@notificationDays, default_notification_days_before),
                default_reminder_frequency_days = COALESCE(@reminderDays, default_reminder_frequency_days),
                default_notify_employee = COALESCE(@notifyEmployee, default_notify_employee),
                default_notify_admin = COALESCE(@notifyAdmin, default_notify_admin),
                default_supervision_frequency_months = COALESCE(@supervisionMonths, default_supervision_frequency_months),
                supervision_months_back = COALESCE(@monthsBack, supervision_months_back),
                supervision_months_forward = COALESCE(@monthsForward, supervision_months_forward),
                default_hidden_roles = COALESCE(@hiddenRoles, default_hidden_roles),
                default_hidden_employee_statuses = COALESCE(@hiddenStatuses, default_hidden_employee_statuses),
                default_hidden_rota_roles = COALESCE(@hiddenRotaRoles, default_hidden_rota_roles),
                default_hidden_rota_employee_statuses = COALESCE(@hiddenRotaStatuses, default_hidden_rota_employee_statuses),
                appraisal_reviews_back = COALESCE(@appraisalReviewsBack, appraisal_reviews_back),
                appraisal_reviews_forward = COALESCE(@appraisalReviewsForward, appraisal_reviews_forward),
                ai_provider = COALESCE(@aiProvider, ai_provider),
                ai_model = COALESCE(@aiModel, ai_model),
                ai_api_key = COALESCE(@aiApiKey, ai_api_key),
                anthropic_api_key = COALESCE(@anthropicApiKey, anthropic_api_key),
                openai_api_key = COALESCE(@openaiApiKey, openai_api_key),
                gemini_api_key = COALESCE(@geminiApiKey, gemini_api_key),
                day_in_life_provider_id = COALESCE(@dayInLifeProviderId, day_in_life_provider_id),
                day_in_life_model = COALESCE(@dayInLifeModel, day_in_life_model),
                day_in_life_system_prompt = COALESCE(@dayInLifePrompt, day_in_life_system_prompt),
                updated_at = NOW()
            RETURNING id, company_name, default_expiry_warning_days, default_notification_days_before,
                      default_reminder_frequency_days, default_notify_employee, default_notify_admin,
                      default_supervision_frequency_months, supervision_months_back, supervision_months_forward,
                      default_hidden_roles, default_hidden_employee_statuses,
                      default_hidden_rota_roles, default_hidden_rota_employee_statuses,
                      appraisal_reviews_back, appraisal_reviews_forward,
                      ai_provider, ai_model, ai_api_key, anthropic_api_key, openai_api_key, gemini_api_key,
                      day_in_life_provider_id, day_in_life_model, day_in_life_system_prompt,
                      created_at, updated_at", conn);

        cmd.Parameters.AddWithValue("companyName", (object?)request.CompanyName ?? DBNull.Value);
        cmd.Parameters.AddWithValue("expiryWarningDays", request.DefaultExpiryWarningDays.HasValue ? request.DefaultExpiryWarningDays.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("notificationDays", request.DefaultNotificationDaysBefore.HasValue ? request.DefaultNotificationDaysBefore.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("reminderDays", request.DefaultReminderFrequencyDays.HasValue ? request.DefaultReminderFrequencyDays.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("notifyEmployee", request.DefaultNotifyEmployee.HasValue ? request.DefaultNotifyEmployee.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("notifyAdmin", request.DefaultNotifyAdmin.HasValue ? request.DefaultNotifyAdmin.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("supervisionMonths", request.DefaultSupervisionFrequencyMonths.HasValue ? request.DefaultSupervisionFrequencyMonths.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("monthsBack", request.SupervisionMonthsBack.HasValue ? request.SupervisionMonthsBack.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("monthsForward", request.SupervisionMonthsForward.HasValue ? request.SupervisionMonthsForward.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("hiddenRoles", request.DefaultHiddenRoles != null ? request.DefaultHiddenRoles : DBNull.Value);
        cmd.Parameters.AddWithValue("hiddenStatuses", request.DefaultHiddenEmployeeStatuses != null ? request.DefaultHiddenEmployeeStatuses : DBNull.Value);
        cmd.Parameters.AddWithValue("hiddenRotaRoles", request.DefaultHiddenRotaRoles != null ? request.DefaultHiddenRotaRoles : DBNull.Value);
        cmd.Parameters.AddWithValue("hiddenRotaStatuses", request.DefaultHiddenRotaEmployeeStatuses != null ? request.DefaultHiddenRotaEmployeeStatuses : DBNull.Value);
        cmd.Parameters.AddWithValue("appraisalReviewsBack", request.AppraisalReviewsBack.HasValue ? request.AppraisalReviewsBack.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("appraisalReviewsForward", request.AppraisalReviewsForward.HasValue ? request.AppraisalReviewsForward.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("aiProvider", (object?)request.AiProvider ?? DBNull.Value);
        cmd.Parameters.AddWithValue("aiModel", (object?)request.AiModel ?? DBNull.Value);
        cmd.Parameters.AddWithValue("aiApiKey", (object?)request.AiApiKey ?? DBNull.Value);
        cmd.Parameters.AddWithValue("anthropicApiKey", (object?)request.AnthropicApiKey ?? DBNull.Value);
        cmd.Parameters.AddWithValue("openaiApiKey", (object?)request.OpenaiApiKey ?? DBNull.Value);
        cmd.Parameters.AddWithValue("geminiApiKey", (object?)request.GeminiApiKey ?? DBNull.Value);
        cmd.Parameters.AddWithValue("dayInLifeProviderId", request.DayInLifeProviderId.HasValue ? request.DayInLifeProviderId.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("dayInLifeModel", (object?)request.DayInLifeModel ?? DBNull.Value);
        cmd.Parameters.AddWithValue("dayInLifePrompt", (object?)request.DayInLifeSystemPrompt ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        var updated = ReadSettings(reader);

        await reader.CloseAsync();
        await _audit.LogAsync("company_settings", updated.Id, "update", userId, oldData: existing, newData: request);

        return updated;
    }

    private static CompanySettings ReadSettings(NpgsqlDataReader reader)
    {
        return new CompanySettings
        {
            Id = reader.GetGuid(0),
            CompanyName = reader.GetString(1),
            DefaultExpiryWarningDays = reader.GetInt32(2),
            DefaultNotificationDaysBefore = reader.GetInt32(3),
            DefaultReminderFrequencyDays = reader.GetInt32(4),
            DefaultNotifyEmployee = reader.GetBoolean(5),
            DefaultNotifyAdmin = reader.GetBoolean(6),
            DefaultSupervisionFrequencyMonths = reader.GetInt32(7),
            SupervisionMonthsBack = reader.GetInt32(8),
            SupervisionMonthsForward = reader.GetInt32(9),
            DefaultHiddenRoles = reader.IsDBNull(10) ? Array.Empty<string>() : reader.GetFieldValue<string[]>(10),
            DefaultHiddenEmployeeStatuses = reader.IsDBNull(11) ? Array.Empty<string>() : reader.GetFieldValue<string[]>(11),
            DefaultHiddenRotaRoles = reader.IsDBNull(12) ? Array.Empty<string>() : reader.GetFieldValue<string[]>(12),
            DefaultHiddenRotaEmployeeStatuses = reader.IsDBNull(13) ? Array.Empty<string>() : reader.GetFieldValue<string[]>(13),
            AppraisalReviewsBack = reader.GetInt32(14),
            AppraisalReviewsForward = reader.GetInt32(15),
            AiProvider = reader.IsDBNull(16) ? null : reader.GetString(16),
            AiModel = reader.IsDBNull(17) ? null : reader.GetString(17),
            AiApiKey = reader.IsDBNull(18) ? null : reader.GetString(18),
            AnthropicApiKey = reader.IsDBNull(19) ? null : reader.GetString(19),
            OpenaiApiKey = reader.IsDBNull(20) ? null : reader.GetString(20),
            GeminiApiKey = reader.IsDBNull(21) ? null : reader.GetString(21),
            DayInLifeProviderId = reader.IsDBNull(22) ? null : reader.GetGuid(22),
            DayInLifeModel = reader.IsDBNull(23) ? null : reader.GetString(23),
            DayInLifeSystemPrompt = reader.IsDBNull(24) ? null : reader.GetString(24),
            CreatedAt = reader.GetDateTime(25),
            UpdatedAt = reader.GetDateTime(26)
        };
    }
}
