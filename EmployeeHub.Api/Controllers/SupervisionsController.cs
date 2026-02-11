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

    [RequirePermission("supervisions.view")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? employeeId = null, [FromQuery] Guid? supervisorId = null, [FromQuery] string? period = null)
    {

        var supervisions = await _supervisionService.GetAllAsync(employeeId, supervisorId, period);
        return Ok(supervisions);
    }

    [RequirePermission("supervisions.view")]
    [HttpGet("employee/{employeeId:guid}")]
    public async Task<IActionResult> GetByEmployee(Guid employeeId)
    {

        var supervisions = await _supervisionService.GetByEmployeeAsync(employeeId);
        return Ok(supervisions);
    }

    [RequirePermission("supervisions.view")]
    [HttpGet("supervisor/{supervisorId:guid}")]
    public async Task<IActionResult> GetBySupervisor(Guid supervisorId)
    {

        var supervisions = await _supervisionService.GetBySupervisorAsync(supervisorId);
        return Ok(supervisions);
    }

    [RequirePermission("supervisions.view")]
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {

        var statuses = await _supervisionService.GetStatusSummaryAsync();
        return Ok(statuses);
    }

    [RequirePermission("supervisions.view")]
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {

        var summary = await _supervisionService.GetSummaryStatsAsync();
        return Ok(summary);
    }

    [RequirePermission("supervisions.add")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSupervisionRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var supervision = await _supervisionService.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetAll), new { }, supervision);
    }

    [RequirePermission("supervisions.edit")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSupervisionRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var supervision = await _supervisionService.UpdateAsync(id, request, userId);
        if (supervision == null) return NotFound();

        return Ok(supervision);
    }

    [RequirePermission("supervisions.delete")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId()!.Value;

        var success = await _supervisionService.DeleteAsync(id, userId);
        if (!success) return NotFound();

        return Ok(new { message = "Supervision deleted" });
    }

    [RequirePermission("supervisions.edit")]
    [HttpPut("required-count")]
    public async Task<IActionResult> UpdateRequiredCount([FromBody] UpdateRequiredCountRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var updated = await _supervisionService.UpdateRequiredCountAsync(request.EmployeeId, request.Period, request.RequiredCount, userId);
        return Ok(new { updated });
    }
}
