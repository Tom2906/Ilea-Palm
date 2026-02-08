using EmployeeHub.Api.Models;

namespace EmployeeHub.Api.Services;

public interface ICompanySettingsService
{
    Task<CompanySettings> GetAsync();
    Task<CompanySettings> UpdateAsync(UpdateCompanySettingsRequest request, Guid userId);
}

public class UpdateCompanySettingsRequest
{
    public string? CompanyName { get; set; }
    public int? DefaultExpiryWarningDays { get; set; }
    public int? DefaultNotificationDaysBefore { get; set; }
    public int? DefaultReminderFrequencyDays { get; set; }
    public bool? DefaultNotifyEmployee { get; set; }
    public bool? DefaultNotifyAdmin { get; set; }
    public int? DefaultSupervisionFrequencyMonths { get; set; }
    public int? SupervisionMonthsBack { get; set; }
    public int? SupervisionMonthsForward { get; set; }
    public int? AppraisalReviewsBack { get; set; }
    public int? AppraisalReviewsForward { get; set; }
    public string[]? DefaultHiddenRoles { get; set; }
    public string[]? DefaultHiddenEmployeeStatuses { get; set; }
    public string[]? DefaultHiddenRotaRoles { get; set; }
    public string[]? DefaultHiddenRotaEmployeeStatuses { get; set; }
    public string? AiProvider { get; set; }
    public string? AiModel { get; set; }
    public string? AiApiKey { get; set; }
}
