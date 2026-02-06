namespace EmployeeHub.Api.Models;

public class LeaveRequest
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public decimal TotalDays { get; set; }
    public string Status { get; set; } = "pending";
    public Guid RequestedBy { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Joined fields
    public string EmployeeName { get; set; } = string.Empty;
    public string RequestedByName { get; set; } = string.Empty;
    public string? ApprovedByName { get; set; }
}
