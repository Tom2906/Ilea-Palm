namespace EmployeeHub.Api.DTOs;

public record CreateAppraisalRequest
{
    public Guid EmployeeId { get; init; }
    public DateOnly DueDate { get; init; }
    public DateOnly? CompletedDate { get; init; }
    public Guid? ConductedById { get; init; }
    public string? Notes { get; init; }
}

public record UpdateAppraisalRequest
{
    public DateOnly? DueDate { get; init; }
    public DateOnly? CompletedDate { get; init; }
    public bool ClearCompleted { get; init; }
    public Guid? ConductedById { get; init; }
    public string? Notes { get; init; }
}

public record AppraisalResponse
{
    public Guid Id { get; init; }
    public Guid EmployeeId { get; init; }
    public string EmployeeName { get; init; } = string.Empty;
    public int ReviewNumber { get; init; }
    public DateOnly DueDate { get; init; }
    public DateOnly? CompletedDate { get; init; }
    public Guid? ConductedById { get; init; }
    public string? ConductedByName { get; init; }
    public string? Notes { get; init; }
    public string Status { get; init; } = string.Empty;
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
    public string? EmployeeStatus { get; init; }
    public DateOnly StartDate { get; init; }
    public int AppraisalFrequencyMonths { get; init; }
    public List<AppraisalCellData?> Reviews { get; init; } = new();
}

public record AppraisalCellData
{
    public Guid? Id { get; init; }
    public int ReviewNumber { get; init; }
    public DateOnly DueDate { get; init; }
    public DateOnly? CompletedDate { get; init; }
    public Guid? ConductedById { get; init; }
    public string? ConductedByName { get; init; }
    public string? Notes { get; init; }
    public string Status { get; init; } = string.Empty;
    public int? DaysUntilDue { get; init; }
}

public record GenerateMilestonesRequest
{
    public Guid EmployeeId { get; init; }
}
