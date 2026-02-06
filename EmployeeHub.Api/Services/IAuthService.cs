using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;

namespace EmployeeHub.Api.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<(LoginResponse? Response, string? Error)> LoginWithMicrosoftAsync(string idToken);
    Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
    Task<User?> GetUserByIdAsync(Guid userId);
    string GenerateJwtToken(User user);
}
