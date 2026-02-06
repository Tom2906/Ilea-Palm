namespace EmployeeHub.Api.Models;

public class LeaveEntitlement
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public int Year { get; set; }
    public decimal TotalDays { get; set; }
    public decimal CarriedOver { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
