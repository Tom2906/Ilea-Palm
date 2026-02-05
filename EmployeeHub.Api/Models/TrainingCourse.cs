namespace EmployeeHub.Api.Models;

public class TrainingCourse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public int? ValidityMonths { get; set; }
    public int ExpiryWarningDaysBefore { get; set; } = 30;
    public int NotificationDaysBefore { get; set; } = 0;
    public int ReminderFrequencyDays { get; set; } = 7;
    public bool NotifyEmployee { get; set; } = true;
    public bool NotifyAdmin { get; set; } = true;
    public string[]? MandatoryForRoles { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
