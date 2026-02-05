namespace EmployeeHub.Api.Models;

public class SupervisionRequirement
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public int RequiredCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
