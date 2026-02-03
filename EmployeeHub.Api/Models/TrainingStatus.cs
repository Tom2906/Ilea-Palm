namespace EmployeeHub.Api.Models;

public class TrainingStatus
{
    public Guid EmployeeId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Department { get; set; }
    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int? ValidityMonths { get; set; }
    public int NotificationDaysBefore { get; set; }
    public bool NotifyEmployee { get; set; }
    public bool NotifyAdmin { get; set; }
    public string[]? MandatoryForRoles { get; set; }
    public Guid? TrainingRecordId { get; set; }
    public DateOnly? CompletionDate { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? DaysUntilExpiry { get; set; }
}
