namespace EmployeeHub.Api.Models;

public class Supervision
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid ConductedById { get; set; }
    public DateOnly SupervisionDate { get; set; }
    public string Period { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public bool IsCompleted { get; set; } = true;
    public int RequiredCount { get; set; } = 1;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
