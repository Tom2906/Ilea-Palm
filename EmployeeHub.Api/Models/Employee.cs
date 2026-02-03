namespace EmployeeHub.Api.Models;

public class Employee
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string Role { get; set; } = "Residential Support Worker";
    public DateOnly StartDate { get; set; }
    public bool Active { get; set; } = true;
    public Guid? StatusId { get; set; }
    public string? StatusName { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
