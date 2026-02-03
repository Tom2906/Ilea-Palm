namespace EmployeeHub.Api.Models;

public class NotificationLog
{
    public Guid Id { get; set; }
    public Guid TrainingRecordId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid CourseId { get; set; }
    public string RecipientEmail { get; set; } = string.Empty;
    public string RecipientType { get; set; } = string.Empty;
    public string NotificationType { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public int? DaysUntilExpiry { get; set; }
}
