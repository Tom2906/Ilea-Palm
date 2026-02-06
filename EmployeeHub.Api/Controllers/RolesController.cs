using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/roles")]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RolesController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("users.manage")) return StatusCode(403);

        var roles = await _roleService.GetAllAsync();
        return Ok(roles);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("users.manage")) return StatusCode(403);

        var role = await _roleService.GetByIdAsync(id);
        if (role == null) return NotFound();
        return Ok(role);
    }

    [HttpGet("permissions")]
    public async Task<IActionResult> GetPermissionKeys()
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("users.manage")) return StatusCode(403);

        var keys = await _roleService.GetAllPermissionKeysAsync();
        return Ok(keys);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRoleRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("users.manage")) return StatusCode(403);

        var role = await _roleService.CreateAsync(request, userId.Value);
        return CreatedAtAction(nameof(GetById), new { id = role.Id }, role);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRoleRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("users.manage")) return StatusCode(403);

        var role = await _roleService.UpdateAsync(id, request, userId.Value);
        if (role == null) return NotFound();
        return Ok(role);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("users.manage")) return StatusCode(403);

        try
        {
            var success = await _roleService.DeleteAsync(id, userId.Value);
            if (!success) return NotFound();
            return Ok(new { message = "Role deleted" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
