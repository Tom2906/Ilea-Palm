using EmployeeHub.Api.Helpers;
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
        var hiddenRolesOrd = reader.GetOrdinal("default_hidden_roles");
        var hiddenStatusesOrd = reader.GetOrdinal("default_hidden_employee_statuses");
        var hiddenRotaRolesOrd = reader.GetOrdinal("default_hidden_rota_roles");
        var hiddenRotaStatusesOrd = reader.GetOrdinal("default_hidden_rota_employee_statuses");

        return new CompanySettings
        {
            Id = reader.GetGuid("id"),
            CompanyName = reader.GetString("company_name"),
            DefaultExpiryWarningDays = reader.GetInt32("default_expiry_warning_days"),
            DefaultNotificationDaysBefore = reader.GetInt32("default_notification_days_before"),
            DefaultReminderFrequencyDays = reader.GetInt32("default_reminder_frequency_days"),
            DefaultNotifyEmployee = reader.GetBoolean("default_notify_employee"),
            DefaultNotifyAdmin = reader.GetBoolean("default_notify_admin"),
            DefaultSupervisionFrequencyMonths = reader.GetInt32("default_supervision_frequency_months"),
            SupervisionMonthsBack = reader.GetInt32("supervision_months_back"),
            SupervisionMonthsForward = reader.GetInt32("supervision_months_forward"),
            DefaultHiddenRoles = reader.IsDBNull(hiddenRolesOrd) ? Array.Empty<string>() : reader.GetFieldValue<string[]>(hiddenRolesOrd),
            DefaultHiddenEmployeeStatuses = reader.IsDBNull(hiddenStatusesOrd) ? Array.Empty<string>() : reader.GetFieldValue<string[]>(hiddenStatusesOrd),
            DefaultHiddenRotaRoles = reader.IsDBNull(hiddenRotaRolesOrd) ? Array.Empty<string>() : reader.GetFieldValue<string[]>(hiddenRotaRolesOrd),
            DefaultHiddenRotaEmployeeStatuses = reader.IsDBNull(hiddenRotaStatusesOrd) ? Array.Empty<string>() : reader.GetFieldValue<string[]>(hiddenRotaStatusesOrd),
            AppraisalReviewsBack = reader.GetInt32("appraisal_reviews_back"),
            AppraisalReviewsForward = reader.GetInt32("appraisal_reviews_forward"),
            AiProvider = reader.GetStringOrNull("ai_provider"),
            AiModel = reader.GetStringOrNull("ai_model"),
            AiApiKey = reader.GetStringOrNull("ai_api_key"),
            AnthropicApiKey = reader.GetStringOrNull("anthropic_api_key"),
            OpenaiApiKey = reader.GetStringOrNull("openai_api_key"),
            GeminiApiKey = reader.GetStringOrNull("gemini_api_key"),
            DayInLifeProviderId = reader.GetGuidOrNull("day_in_life_provider_id"),
            DayInLifeModel = reader.GetStringOrNull("day_in_life_model"),
            DayInLifeSystemPrompt = reader.GetStringOrNull("day_in_life_system_prompt"),
            CreatedAt = reader.GetDateTime("created_at"),
            UpdatedAt = reader.GetDateTime("updated_at")
        };
    }
}
