namespace EmployeeHub.Api.DTOs;

public record CreateAppraisalRequest
{
    public Guid EmployeeId { get; init; }
    public string MilestoneType { get; init; } = string.Empty;
    public DateOnly DueDate { get; init; }
    public DateOnly? CompletedDate { get; init; }
    public Guid? ConductedById { get; init; }
    public string? Notes { get; init; }
}

public record UpdateAppraisalRequest
{
    public DateOnly? DueDate { get; init; }
    public DateOnly? CompletedDate { get; init; }
    public Guid? ConductedById { get; init; }
    public string? Notes { get; init; }
}

public record AppraisalResponse
{
    public Guid Id { get; init; }
    public Guid EmployeeId { get; init; }
    public string EmployeeName { get; init; } = string.Empty;
    public string MilestoneType { get; init; } = string.Empty;
    public string MilestoneLabel { get; init; } = string.Empty;
    public DateOnly DueDate { get; init; }
    public DateOnly? CompletedDate { get; init; }
    public Guid? ConductedById { get; init; }
    public string? ConductedByName { get; init; }
    public string? Notes { get; init; }
    public string Status { get; init; } = string.Empty; // completed, due_soon, overdue, not_yet_due
    public int? DaysUntilDue { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record AppraisalMatrixRow
{
    public Guid EmployeeId { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public string? Department { get; init; }
    public DateOnly StartDate { get; init; }
    public List<AppraisalResponse> Milestones { get; init; } = new();
}

public record AppraisalSummary
{
    public int TotalEmployees { get; init; }
    public int Completed { get; init; }
    public int DueSoon { get; init; }
    public int Overdue { get; init; }
    public int NotYetDue { get; init; }
}

public record GenerateMilestonesRequest
{
    public Guid EmployeeId { get; init; }
}
