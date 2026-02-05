namespace EmployeeHub.Api.DTOs;

public record CreateSupervisionRequest
{
    public Guid EmployeeId { get; init; }
    public Guid ConductedById { get; init; }
    public DateOnly SupervisionDate { get; init; }
    public string? Notes { get; init; }
    public bool IsCompleted { get; init; } = true;
    public int RequiredCount { get; init; } = 1;
}

public record UpdateSupervisionRequest
{
    public Guid ConductedById { get; init; }
    public DateOnly SupervisionDate { get; init; }
    public string? Notes { get; init; }
    public bool IsCompleted { get; init; } = true;
    public int RequiredCount { get; init; } = 1;
}

public record SupervisionResponse
{
    public Guid Id { get; init; }
    public Guid EmployeeId { get; init; }
    public string EmployeeName { get; init; } = string.Empty;
    public Guid ConductedById { get; init; }
    public string ConductedByName { get; init; } = string.Empty;
    public DateOnly SupervisionDate { get; init; }
    public string Period { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public bool IsCompleted { get; init; }
    public int RequiredCount { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record SupervisionStatusResponse
{
    public Guid EmployeeId { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public string? Department { get; init; }
    public Guid? ReportsTo { get; init; }
    public int SupervisionFrequency { get; init; }
    public string? SupervisorName { get; init; }
    public DateOnly? LastSupervisionDate { get; init; }
    public int? DaysSinceLastSupervision { get; init; }
    public string Status { get; init; } = string.Empty; // Never, OK, Due Soon, Overdue
    public DateOnly StartDate { get; init; }
    public string? EmployeeStatus { get; init; } // Active, Suspended, etc.
}

public record SupervisionSummary
{
    public int TotalEmployees { get; init; }
    public int NeverSupervised { get; init; }
    public int Ok { get; init; }
    public int DueSoon { get; init; }
    public int Overdue { get; init; }
}

public record UpdateRequiredCountRequest
{
    public Guid EmployeeId { get; init; }
    public string Period { get; init; } = string.Empty;
    public int RequiredCount { get; init; }
}
