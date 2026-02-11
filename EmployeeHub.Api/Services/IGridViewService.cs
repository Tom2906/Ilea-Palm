using EmployeeHub.Api.DTOs;

namespace EmployeeHub.Api.Services;

public interface IGridViewService
{
    Task<List<GridViewResponse>> GetByUserAndGridAsync(Guid userId, string gridType);
    Task<GridViewResponse?> GetByIdAsync(Guid id, Guid userId);
    Task<GridViewResponse> CreateAsync(CreateGridViewRequest request, Guid userId);
    Task<GridViewResponse> UpdateAsync(Guid id, UpdateGridViewRequest request, Guid userId);
    Task DeleteAsync(Guid id, Guid userId);
}
