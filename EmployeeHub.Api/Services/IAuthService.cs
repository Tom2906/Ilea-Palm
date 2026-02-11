using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;

namespace EmployeeHub.Api.Services;

public interface IAuthService
{
    Task<(LoginResponse? Response, string? Error)> LoginAsync(LoginRequest request);
    Task<(LoginResponse? Response, string? Error)> LoginWithMicrosoftAsync(string idToken);
    Task<(bool Success, string? Error)> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
    Task<User?> GetUserByIdAsync(Guid userId);
    string GenerateJwtToken(User user);
}
