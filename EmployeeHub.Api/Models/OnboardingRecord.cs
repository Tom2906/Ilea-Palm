namespace EmployeeHub.Api.Models;

public class OnboardingRecord
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid ItemId { get; set; }
    public string Status { get; set; } = "pending";
    public DateOnly? CompletedDate { get; set; }
    public string? Notes { get; set; }
    public Guid RecordedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
