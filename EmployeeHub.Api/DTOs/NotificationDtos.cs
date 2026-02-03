namespace EmployeeHub.Api.DTOs;

public class PendingNotificationResponse
{
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeEmail { get; set; } = string.Empty;
    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public Guid? TrainingRecordId { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public int? DaysUntilExpiry { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool NotifyEmployee { get; set; }
    public bool NotifyAdmin { get; set; }
}

public class SendNotificationsResponse
{
    public int EmailsSent { get; set; }
    public int Skipped { get; set; }
    public List<string> Errors { get; set; } = new();
}

public class NotificationLogResponse
{
    public Guid Id { get; set; }
    public Guid TrainingRecordId { get; set; }
    public Guid EmployeeId { get; set; }
    public string? EmployeeName { get; set; }
    public Guid CourseId { get; set; }
    public string? CourseName { get; set; }
    public string RecipientEmail { get; set; } = string.Empty;
    public string RecipientType { get; set; } = string.Empty;
    public string NotificationType { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public int? DaysUntilExpiry { get; set; }
}
