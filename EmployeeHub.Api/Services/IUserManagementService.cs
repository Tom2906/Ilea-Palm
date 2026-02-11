using EmployeeHub.Api.DTOs;

namespace EmployeeHub.Api.Services;

public interface IUserManagementService
{
    Task<List<UserListResponse>> GetAllAsync();
    Task<UserListResponse?> GetByIdAsync(Guid id);
    Task<UserListResponse> CreateAsync(CreateUserRequest request, Guid createdBy);
    Task<UserListResponse?> UpdateAsync(Guid id, UpdateUserRequest request, Guid updatedBy);
    Task<(bool Success, string? Error)> ResetPasswordAsync(Guid id, ResetPasswordRequest request, Guid resetBy);
}
