using EmployeeHub.Api.DTOs;

namespace EmployeeHub.Api.Services;

public interface ISupervisionExceptionService
{
    Task<List<SupervisionExceptionResponse>> GetAllAsync(Guid? employeeId = null, string? period = null);
    Task<List<SupervisionExceptionResponse>> GetByEmployeeAsync(Guid employeeId);
    Task<List<SupervisionExceptionResponse>> GetByPeriodAsync(string period);
    Task<SupervisionExceptionResponse> CreateAsync(CreateSupervisionExceptionRequest request, Guid userId);
    Task<bool> DeleteAsync(Guid id, Guid userId);
}
