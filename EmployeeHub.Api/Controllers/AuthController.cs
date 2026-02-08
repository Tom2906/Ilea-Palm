using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var (response, error) = await _authService.LoginAsync(request);
        if (response == null)
            return Unauthorized(new { error = error ?? "Invalid email or password" });

        return Ok(response);
    }

    [HttpPost("microsoft")]
    public async Task<IActionResult> MicrosoftLogin([FromBody] MicrosoftLoginRequest request)
    {
        var (response, error) = await _authService.LoginWithMicrosoftAsync(request.IdToken);
        if (response == null)
            return Unauthorized(new { error = error ?? "Microsoft sign-in failed" });

        return Ok(response);
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null)
            return Unauthorized();

        var success = await _authService.ChangePasswordAsync(userId.Value, request);
        if (!success)
            return BadRequest(new { error = "Current password is incorrect" });

        return Ok(new { message = "Password changed successfully" });
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = User.GetUserId();
        if (userId == null)
            return Unauthorized();

        var user = await _authService.GetUserByIdAsync(userId.Value);
        if (user == null)
            return Unauthorized();

        var info = new UserInfo
        {
            Id = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName,
            RoleName = user.RoleName,
            Permissions = user.Permissions,
            EmployeeId = user.EmployeeId
        };

        return Ok(info);
    }
}
