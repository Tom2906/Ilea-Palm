using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IDbService _db;

    public AuthController(IAuthService authService, IDbService db)
    {
        _authService = authService;
        _db = db;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        if (result == null)
            return Unauthorized(new { error = "Invalid email or password" });

        return Ok(result);
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
            DataScope = user.DataScope,
            Permissions = user.Permissions,
            EmployeeId = user.EmployeeId
        };

        // For "reports" scope, include direct report employee IDs
        if (user.DataScope == "reports" && user.EmployeeId.HasValue)
        {
            await using var conn = await _db.GetConnectionAsync();
            await using var cmd = new NpgsqlCommand(
                "SELECT id FROM employees WHERE reports_to = @managerId AND active = true", conn);
            cmd.Parameters.AddWithValue("managerId", user.EmployeeId.Value);

            var reportIds = new List<Guid>();
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                reportIds.Add(reader.GetGuid(0));

            info.DirectReportIds = reportIds;
        }

        return Ok(info);
    }
}
