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

    [RequirePermission("users.manage")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {

        var roles = await _roleService.GetAllAsync();
        return Ok(roles);
    }

    [RequirePermission("users.manage")]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {

        var role = await _roleService.GetByIdAsync(id);
        if (role == null) return NotFound();
        return Ok(role);
    }

    [RequirePermission("users.manage")]
    [HttpGet("permissions")]
    public async Task<IActionResult> GetPermissionKeys()
    {

        var keys = await _roleService.GetAllPermissionKeysAsync();
        return Ok(keys);
    }

    [RequirePermission("users.manage")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRoleRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var role = await _roleService.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetById), new { id = role.Id }, role);
    }

    [RequirePermission("users.manage")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRoleRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var role = await _roleService.UpdateAsync(id, request, userId);
        if (role == null) return NotFound();
        return Ok(role);
    }

    [RequirePermission("users.manage")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId()!.Value;

        var success = await _roleService.DeleteAsync(id, userId);
        if (!success) return NotFound();
        return Ok(new { message = "Role deleted" });
    }
}
