using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;

namespace EmployeeHub.Api.Services;

public interface IEmployeeReferenceService
{
    Task<List<EmployeeReference>> GetByEmployeeAsync(Guid employeeId);
    Task<EmployeeReference?> GetByIdAsync(Guid id);
    Task<EmployeeReference> CreateAsync(Guid employeeId, CreateEmployeeReferenceRequest request, Guid userId);
    Task<EmployeeReference?> UpdateAsync(Guid id, UpdateEmployeeReferenceRequest request, Guid userId);
    Task<bool> DeleteAsync(Guid id, Guid userId);
}
