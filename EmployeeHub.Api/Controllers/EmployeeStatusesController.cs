using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/employee-statuses")]
public class EmployeeStatusesController : ControllerBase
{
    private readonly IEmployeeStatusService _statusService;

    public EmployeeStatusesController(IEmployeeStatusService statusService)
    {
        _statusService = statusService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
    {
        if (User.GetUserId() == null) return Unauthorized();

        var statuses = await _statusService.GetAllAsync(includeInactive);
        var response = statuses.Select(s => MapToResponse(s));
        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeStatusRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("employee_statuses.manage")) return StatusCode(403);

        var status = await _statusService.CreateAsync(request, userId.Value);
        return CreatedAtAction(nameof(GetAll), MapToResponse(status));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmployeeStatusRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("employee_statuses.manage")) return StatusCode(403);

        var status = await _statusService.UpdateAsync(id, request, userId.Value);
        if (status == null) return NotFound();

        return Ok(MapToResponse(status));
    }

    private static EmployeeStatusResponse MapToResponse(Models.EmployeeStatus s) => new()
    {
        Id = s.Id,
        Name = s.Name,
        DisplayOrder = s.DisplayOrder,
        Active = s.Active,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt
    };
}
