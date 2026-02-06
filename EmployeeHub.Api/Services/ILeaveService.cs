using EmployeeHub.Api.DTOs;

namespace EmployeeHub.Api.Services;

public interface ILeaveService
{
    Task<List<LeaveRequestResponse>> GetRequestsAsync(Guid? employeeId = null, string? status = null);
    Task<LeaveRequestResponse?> GetRequestByIdAsync(Guid id);
    Task<LeaveRequestResponse> CreateRequestAsync(CreateLeaveRequestRequest request, Guid userId);
    Task<LeaveRequestResponse?> UpdateStatusAsync(Guid id, UpdateLeaveStatusRequest request, Guid userId);
    Task<LeaveBalanceResponse> GetBalanceAsync(Guid employeeId, int year);
    Task<LeaveEntitlementResponse> SetEntitlementAsync(SetLeaveEntitlementRequest request, Guid userId);
    Task<List<LeaveEntitlementResponse>> GetEntitlementsAsync(int year);
    Task<Dictionary<Guid, HashSet<string>>> GetApprovedLeaveDatesForMonthAsync(int year, int month);
}
