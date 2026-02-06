using System.ComponentModel.DataAnnotations;

namespace EmployeeHub.Api.DTOs;

public class ShiftTypeResponse
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal DefaultHours { get; set; }
    public bool IncludesSleep { get; set; }
    public string? DisplayColor { get; set; }
    public int SortOrder { get; set; }
}

public class ShiftResponse
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public DateOnly Date { get; set; }
    public Guid ShiftTypeId { get; set; }
    public string ShiftTypeCode { get; set; } = string.Empty;
    public decimal Hours { get; set; }
    public bool IncludesSleep { get; set; }
    public string? DisplayColor { get; set; }
    public string? Notes { get; set; }
}

public class CreateShiftRequest
{
    [Required]
    public Guid EmployeeId { get; set; }

    [Required]
    public DateOnly Date { get; set; }

    [Required]
    public Guid ShiftTypeId { get; set; }

    public decimal? Hours { get; set; }
    public string? Notes { get; set; }
}

public class UpdateShiftRequest
{
    public Guid? ShiftTypeId { get; set; }
    public decimal? Hours { get; set; }
    public string? Notes { get; set; }
}

public class RotaEmployeeResponse
{
    public Guid EmployeeId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Dictionary<string, ShiftResponse> Shifts { get; set; } = new();
    public HashSet<string> LeaveDates { get; set; } = new();
    public RotaSummary Summary { get; set; } = new();
}

public class RotaSummary
{
    public decimal TotalHours { get; set; }
    public int TotalSleeps { get; set; }
    public decimal? OverUnder { get; set; }
    public int AnnualLeaveDays { get; set; }
}

public class RotaMonthResponse
{
    public int Month { get; set; }
    public int Year { get; set; }
    public int DaysInMonth { get; set; }
    public decimal? ContractedHours { get; set; }
    public List<RotaEmployeeResponse> Staff { get; set; } = new();
    public List<ShiftTypeResponse> ShiftTypes { get; set; } = new();
}

public class MonthlyHoursResponse
{
    public Guid Id { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal ContractedHours { get; set; }
}

public class SetMonthlyHoursRequest
{
    [Required]
    public int Year { get; set; }

    [Required]
    public int Month { get; set; }

    [Required]
    public decimal ContractedHours { get; set; }
}
