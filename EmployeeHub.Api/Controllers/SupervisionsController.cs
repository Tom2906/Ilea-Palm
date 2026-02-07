using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/supervisions")]
public class SupervisionsController : ControllerBase
{
    private readonly ISupervisionService _supervisionService;

    public SupervisionsController(ISupervisionService supervisionService)
    {
        _supervisionService = supervisionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? employeeId = null, [FromQuery] Guid? supervisorId = null, [FromQuery] string? period = null)
    {
        if (User.GetUserId() == null) return Unauthorized();
        if (!User.HasPermission("supervisions.view")) return StatusCode(403);

        var supervisions = await _supervisionService.GetAllAsync(employeeId, supervisorId, period);
        return Ok(supervisions);
    }

    [HttpGet("employee/{employeeId:guid}")]
    public async Task<IActionResult> GetByEmployee(Guid employeeId)
    {
        if (User.GetUserId() == null) return Unauthorized();
        if (!User.HasPermission("supervisions.view")) return StatusCode(403);

        var supervisions = await _supervisionService.GetByEmployeeAsync(employeeId);
        return Ok(supervisions);
    }

    [HttpGet("supervisor/{supervisorId:guid}")]
    public async Task<IActionResult> GetBySupervisor(Guid supervisorId)
    {
        if (User.GetUserId() == null) return Unauthorized();
        if (!User.HasPermission("supervisions.view")) return StatusCode(403);

        var supervisions = await _supervisionService.GetBySupervisorAsync(supervisorId);
        return Ok(supervisions);
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        if (User.GetUserId() == null) return Unauthorized();
        if (!User.HasPermission("supervisions.view")) return StatusCode(403);

        var statuses = await _supervisionService.GetStatusSummaryAsync();
        return Ok(statuses);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        if (User.GetUserId() == null) return Unauthorized();
        if (!User.HasPermission("supervisions.view")) return StatusCode(403);

        var summary = await _supervisionService.GetSummaryStatsAsync();
        return Ok(summary);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSupervisionRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("supervisions.add")) return StatusCode(403);

        var supervision = await _supervisionService.CreateAsync(request, userId.Value);
        return CreatedAtAction(nameof(GetAll), new { }, supervision);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSupervisionRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("supervisions.edit")) return StatusCode(403);

        var supervision = await _supervisionService.UpdateAsync(id, request, userId.Value);
        if (supervision == null) return NotFound();

        return Ok(supervision);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("supervisions.delete")) return StatusCode(403);

        var success = await _supervisionService.DeleteAsync(id, userId.Value);
        if (!success) return NotFound();

        return Ok(new { message = "Supervision deleted" });
    }

    [HttpPut("required-count")]
    public async Task<IActionResult> UpdateRequiredCount([FromBody] UpdateRequiredCountRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("supervisions.edit")) return StatusCode(403);

        var updated = await _supervisionService.UpdateRequiredCountAsync(request.EmployeeId, request.Period, request.RequiredCount, userId.Value);
        return Ok(new { updated });
    }
}
