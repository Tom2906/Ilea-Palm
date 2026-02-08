namespace EmployeeHub.Api.Models;

public class CompanySettings
{
    public Guid Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;

    // Training defaults
    public int DefaultExpiryWarningDays { get; set; } = 30;
    public int DefaultNotificationDaysBefore { get; set; } = 0;
    public int DefaultReminderFrequencyDays { get; set; } = 7;
    public bool DefaultNotifyEmployee { get; set; } = true;
    public bool DefaultNotifyAdmin { get; set; } = true;

    // Supervision defaults
    public int DefaultSupervisionFrequencyMonths { get; set; } = 1;
    public int SupervisionMonthsBack { get; set; } = 9;
    public int SupervisionMonthsForward { get; set; } = 3;
    public string[] DefaultHiddenRoles { get; set; } = Array.Empty<string>();
    public string[] DefaultHiddenEmployeeStatuses { get; set; } = Array.Empty<string>();

    // Appraisal grid
    public int AppraisalReviewsBack { get; set; } = 2;
    public int AppraisalReviewsForward { get; set; } = 2;

    // Rota-specific filters
    public string[] DefaultHiddenRotaRoles { get; set; } = Array.Empty<string>();
    public string[] DefaultHiddenRotaEmployeeStatuses { get; set; } = Array.Empty<string>();

    // AI Configuration (Legacy - kept for backward compatibility)
    public string? AiProvider { get; set; }
    public string? AiModel { get; set; }
    public string? AiApiKey { get; set; }
    public string? AnthropicApiKey { get; set; }
    public string? OpenaiApiKey { get; set; }
    public string? GeminiApiKey { get; set; }

    // Day in the Life AI Configuration (New approach)
    public Guid? DayInLifeProviderId { get; set; }
    public string? DayInLifeModel { get; set; }
    public string? DayInLifeSystemPrompt { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
