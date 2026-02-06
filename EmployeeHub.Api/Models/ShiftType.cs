namespace EmployeeHub.Api.Models;

public class ShiftType
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal DefaultHours { get; set; }
    public bool IncludesSleep { get; set; }
    public string? DisplayColor { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
