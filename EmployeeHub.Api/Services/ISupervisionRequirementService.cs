using EmployeeHub.Api.DTOs;

namespace EmployeeHub.Api.Services;

public interface ISupervisionRequirementService
{
    Task<List<SupervisionRequirementDto>> GetAllAsync();
    Task<List<SupervisionRequirementDto>> GetByEmployeeAsync(Guid employeeId);
    Task<SupervisionRequirementDto?> GetByIdAsync(Guid id);
    Task<int> GetRequirementForMonthAsync(Guid employeeId, DateOnly month);
    Task<SupervisionRequirementDto> CreateAsync(CreateSupervisionRequirementRequest request);
    Task<SupervisionRequirementDto?> UpdateAsync(Guid id, UpdateSupervisionRequirementRequest request);
    Task<bool> DeleteAsync(Guid id);
}
