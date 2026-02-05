namespace EmployeeHub.Api.DTOs;

public record CreateSupervisionExceptionRequest
{
    public Guid EmployeeId { get; init; }
    public string Period { get; init; } = string.Empty; // 'YYYY-MM' format
    public string ExceptionType { get; init; } = string.Empty; // 'not_required', 'annual_leave', 'sick_leave'
    public string? Notes { get; init; }
}

public record SupervisionExceptionResponse
{
    public Guid Id { get; init; }
    public Guid EmployeeId { get; init; }
    public string EmployeeName { get; init; } = string.Empty;
    public string Period { get; init; } = string.Empty;
    public string ExceptionType { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public Guid? CreatedBy { get; init; }
    public string? CreatedByName { get; init; }
    public DateTime CreatedAt { get; init; }
}
