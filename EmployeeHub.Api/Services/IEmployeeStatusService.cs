using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;

namespace EmployeeHub.Api.Services;

public interface IEmployeeStatusService
{
    Task<List<EmployeeStatus>> GetAllAsync(bool includeInactive = false);
    Task<EmployeeStatus?> GetByIdAsync(Guid id);
    Task<EmployeeStatus> CreateAsync(CreateEmployeeStatusRequest request, Guid userId);
    Task<EmployeeStatus?> UpdateAsync(Guid id, UpdateEmployeeStatusRequest request, Guid userId);
}
