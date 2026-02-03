namespace EmployeeHub.Api.Models;

public class TrainingRecord
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid CourseId { get; set; }
    public DateOnly CompletionDate { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public string? CertificateUrl { get; set; }
    public string? Notes { get; set; }
    public Guid RecordedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}
