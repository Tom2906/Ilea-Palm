using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;

namespace EmployeeHub.Api.Services;

public interface IEmployeeService
{
    Task<List<Employee>> GetAllAsync(bool includeInactive = false);
    Task<Employee?> GetByIdAsync(Guid id);
    Task<Employee> CreateAsync(CreateEmployeeRequest request, Guid userId);
    Task<Employee?> UpdateAsync(Guid id, UpdateEmployeeRequest request, Guid userId);
    Task<bool> SoftDeleteAsync(Guid id, Guid userId);
}
