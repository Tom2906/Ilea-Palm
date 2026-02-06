using System.ComponentModel.DataAnnotations;

namespace EmployeeHub.Api.DTOs;

public class LeaveRequestResponse
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public decimal TotalDays { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid RequestedBy { get; set; }
    public string RequestedByName { get; set; } = string.Empty;
    public Guid? ApprovedBy { get; set; }
    public string? ApprovedByName { get; set; }
    public string? ApprovedAt { get; set; }
    public string? Notes { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class CreateLeaveRequestRequest
{
    [Required]
    public Guid EmployeeId { get; set; }

    [Required]
    public string StartDate { get; set; } = string.Empty;

    [Required]
    public string EndDate { get; set; } = string.Empty;

    [Required]
    public decimal TotalDays { get; set; }

    public string? Notes { get; set; }
}

public class UpdateLeaveStatusRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;

    public string? Notes { get; set; }
}

public class LeaveBalanceResponse
{
    public decimal TotalEntitlement { get; set; }
    public decimal CarriedOver { get; set; }
    public decimal ApprovedDaysTaken { get; set; }
    public decimal PendingDays { get; set; }
    public decimal Remaining { get; set; }
}

public class LeaveEntitlementResponse
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public int Year { get; set; }
    public decimal TotalDays { get; set; }
    public decimal CarriedOver { get; set; }
    public decimal ApprovedDays { get; set; }
    public decimal RemainingDays { get; set; }
    public string? Notes { get; set; }
}

public class SetLeaveEntitlementRequest
{
    [Required]
    public Guid EmployeeId { get; set; }

    [Required]
    public int Year { get; set; }

    [Required]
    public decimal TotalDays { get; set; }

    public decimal CarriedOver { get; set; }

    public string? Notes { get; set; }
}
