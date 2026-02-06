namespace EmployeeHub.Api.Models;

public class Shift
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public DateOnly Date { get; set; }
    public Guid ShiftTypeId { get; set; }
    public decimal? Hours { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Joined fields
    public string ShiftTypeCode { get; set; } = string.Empty;
    public string ShiftTypeName { get; set; } = string.Empty;
    public decimal DefaultHours { get; set; }
    public bool IncludesSleep { get; set; }
    public string? DisplayColor { get; set; }
}
