using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/supervisions")]
public class SupervisionsController : ControllerBase
{
    private readonly ISupervisionService _supervisionService;
    private readonly IDbService _db;

    public SupervisionsController(ISupervisionService supervisionService, IDbService db)
    {
        _supervisionService = supervisionService;
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? employeeId = null, [FromQuery] Guid? supervisorId = null, [FromQuery] string? period = null)
    {
        if (User.GetUserId() == null) return Unauthorized();

        var supervisions = await _supervisionService.GetAllAsync(employeeId, supervisorId, period);
        return Ok(supervisions);
    }

    [HttpGet("employee/{employeeId:guid}")]
    public async Task<IActionResult> GetByEmployee(Guid employeeId)
    {
        if (User.GetUserId() == null) return Unauthorized();

        var supervisions = await _supervisionService.GetByEmployeeAsync(employeeId);
        return Ok(supervisions);
    }

    [HttpGet("supervisor/{supervisorId:guid}")]
    public async Task<IActionResult> GetBySupervisor(Guid supervisorId)
    {
        if (User.GetUserId() == null) return Unauthorized();

        var supervisions = await _supervisionService.GetBySupervisorAsync(supervisorId);
        return Ok(supervisions);
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        if (User.GetUserId() == null) return Unauthorized();

        var statuses = await _supervisionService.GetStatusSummaryAsync();
        return Ok(statuses);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        if (User.GetUserId() == null) return Unauthorized();

        var summary = await _supervisionService.GetSummaryStatsAsync();
        return Ok(summary);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSupervisionRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        if (!User.HasPermission("supervisions.create")) return StatusCode(403);
        if (!await IsInScope(request.EmployeeId)) return StatusCode(403);

        var supervision = await _supervisionService.CreateAsync(request, userId.Value);
        return CreatedAtAction(nameof(GetAll), new { }, supervision);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSupervisionRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("supervisions.manage")) return StatusCode(403);

        var supervision = await _supervisionService.UpdateAsync(id, request, userId.Value);
        if (supervision == null) return NotFound();

        return Ok(supervision);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("supervisions.manage")) return StatusCode(403);

        var success = await _supervisionService.DeleteAsync(id, userId.Value);
        if (!success) return NotFound();

        return Ok(new { message = "Supervision deleted" });
    }

    [HttpPut("required-count")]
    public async Task<IActionResult> UpdateRequiredCount([FromBody] UpdateRequiredCountRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("supervisions.manage")) return StatusCode(403);

        var updated = await _supervisionService.UpdateRequiredCountAsync(request.EmployeeId, request.Period, request.RequiredCount, userId.Value);
        return Ok(new { updated });
    }

    private async Task<bool> IsInScope(Guid employeeId)
    {
        var scope = User.GetDataScope();
        if (scope == "all") return true;
        if (scope == "own") return User.GetEmployeeId() == employeeId;
        if (scope == "reports") return await IsManagerOfEmployee(employeeId);
        return false;
    }

    private async Task<bool> IsManagerOfEmployee(Guid employeeId)
    {
        var myEmpId = User.GetEmployeeId();
        if (myEmpId == null) return false;

        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT 1 FROM employees WHERE id = @empId AND reports_to = @managerId", conn);
        cmd.Parameters.AddWithValue("empId", employeeId);
        cmd.Parameters.AddWithValue("managerId", myEmpId.Value);

        return await cmd.ExecuteScalarAsync() != null;
    }
}
