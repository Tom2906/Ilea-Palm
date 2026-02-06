using EmployeeHub.Api.DTOs;

namespace EmployeeHub.Api.Services;

public interface IRoleService
{
    Task<List<RoleResponse>> GetAllAsync();
    Task<RoleResponse?> GetByIdAsync(Guid id);
    Task<RoleResponse> CreateAsync(CreateRoleRequest request, Guid userId);
    Task<RoleResponse?> UpdateAsync(Guid id, UpdateRoleRequest request, Guid userId);
    Task<bool> DeleteAsync(Guid id, Guid userId);
    Task<List<string>> GetAllPermissionKeysAsync();
}
