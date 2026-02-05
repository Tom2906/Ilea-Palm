using System.ComponentModel.DataAnnotations;

namespace EmployeeHub.Api.DTOs;

public class CreateEmployeeRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;

    public string? Department { get; set; }

    [Required]
    public string Role { get; set; } = "Residential Support Worker";

    [Required]
    public DateOnly StartDate { get; set; }

    public Guid? StatusId { get; set; }
    public string? Notes { get; set; }
    public Guid? ReportsTo { get; set; }
    public int SupervisionFrequency { get; set; } = 2;
}

public class UpdateEmployeeRequest
{
    [EmailAddress]
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Department { get; set; }
    public string? Role { get; set; }
    public DateOnly? StartDate { get; set; }
    public bool? Active { get; set; }
    public Guid? StatusId { get; set; }
    public string? Notes { get; set; }
    public Guid? ReportsTo { get; set; }
    public int? SupervisionFrequency { get; set; }
}

public class EmployeeResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public bool Active { get; set; }
    public Guid? StatusId { get; set; }
    public string? StatusName { get; set; }
    public string? Notes { get; set; }
    public Guid? ReportsTo { get; set; }
    public string? SupervisorName { get; set; }
    public int SupervisionFrequency { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
