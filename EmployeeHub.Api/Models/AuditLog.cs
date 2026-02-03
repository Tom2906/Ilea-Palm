namespace EmployeeHub.Api.Models;

public class AuditLog
{
    public Guid Id { get; set; }
    public string TableName { get; set; } = string.Empty;
    public Guid RecordId { get; set; }
    public string Action { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public string? OldData { get; set; }
    public string? NewData { get; set; }
    public DateTime CreatedAt { get; set; }
}
