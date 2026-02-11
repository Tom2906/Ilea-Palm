using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserManagementService _userService;

    public UsersController(IUserManagementService userService)
    {
        _userService = userService;
    }

    [RequirePermission("users.manage")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {

        var users = await _userService.GetAllAsync();
        return Ok(users);
    }

    [RequirePermission("users.manage")]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {

        var user = await _userService.GetByIdAsync(id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [RequirePermission("users.manage")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var user = await _userService.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [RequirePermission("users.manage")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest request)
    {
        var userId = User.GetUserId()!.Value;

        // Cannot change own role or deactivate self
        if (id == userId)
        {
            return BadRequest(new { error = "Cannot modify your own account" });
        }

        var user = await _userService.UpdateAsync(id, request, userId);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [RequirePermission("users.manage")]
    [HttpPost("{id:guid}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var (success, error) = await _userService.ResetPasswordAsync(id, request, userId);
        if (!success)
            return string.IsNullOrEmpty(error) || error == "User not found"
                ? NotFound()
                : BadRequest(new { error });
        return Ok(new { message = "Password reset successfully" });
    }
}
