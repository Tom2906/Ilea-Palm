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

    [RequirePermission]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
    {
        var statuses = await _statusService.GetAllAsync(includeInactive);
        var response = statuses.Select(s => MapToResponse(s));
        return Ok(response);
    }

    [RequirePermission("employee_statuses.manage")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeStatusRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var status = await _statusService.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetAll), MapToResponse(status));
    }

    [RequirePermission("employee_statuses.manage")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmployeeStatusRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var status = await _statusService.UpdateAsync(id, request, userId);
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
