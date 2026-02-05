using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;

namespace EmployeeHub.Api.Services;

public interface ISupervisionService
{
    Task<List<SupervisionResponse>> GetAllAsync(Guid? employeeId = null, Guid? supervisorId = null, string? period = null);
    Task<List<SupervisionResponse>> GetByEmployeeAsync(Guid employeeId);
    Task<List<SupervisionResponse>> GetBySupervisorAsync(Guid supervisorId);
    Task<List<SupervisionStatusResponse>> GetStatusSummaryAsync();
    Task<SupervisionSummary> GetSummaryStatsAsync();
    Task<SupervisionResponse> CreateAsync(CreateSupervisionRequest request, Guid recordedBy);
    Task<SupervisionResponse?> UpdateAsync(Guid id, UpdateSupervisionRequest request, Guid recordedBy);
    Task<bool> DeleteAsync(Guid id, Guid recordedBy);
    Task<int> UpdateRequiredCountAsync(Guid employeeId, string period, int requiredCount, Guid recordedBy);
}
