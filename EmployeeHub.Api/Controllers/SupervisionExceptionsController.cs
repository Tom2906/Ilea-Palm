using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/supervision-exceptions")]
public class SupervisionExceptionsController : ControllerBase
{
    private readonly ISupervisionExceptionService _exceptionService;

    public SupervisionExceptionsController(ISupervisionExceptionService exceptionService)
    {
        _exceptionService = exceptionService;
    }

    [RequirePermission("supervisions.view")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? employeeId = null, [FromQuery] string? period = null)
    {

        var exceptions = await _exceptionService.GetAllAsync(employeeId, period);
        return Ok(exceptions);
    }

    [RequirePermission("supervisions.view")]
    [HttpGet("employee/{employeeId:guid}")]
    public async Task<IActionResult> GetByEmployee(Guid employeeId)
    {

        var exceptions = await _exceptionService.GetByEmployeeAsync(employeeId);
        return Ok(exceptions);
    }

    [RequirePermission("supervisions.view")]
    [HttpGet("period/{period}")]
    public async Task<IActionResult> GetByPeriod(string period)
    {

        var exceptions = await _exceptionService.GetByPeriodAsync(period);
        return Ok(exceptions);
    }

    [RequirePermission("supervisions.edit")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSupervisionExceptionRequest request)
    {
        var userId = User.GetUserId()!.Value;

        // Validate exception_type
        var validTypes = new[] { "not_required", "annual_leave", "sick_leave" };
        if (!validTypes.Contains(request.ExceptionType))
        {
            return BadRequest(new { error = "Invalid exception_type. Must be one of: not_required, annual_leave, sick_leave" });
        }

        // Validate period format (YYYY-MM)
        if (string.IsNullOrEmpty(request.Period) || !System.Text.RegularExpressions.Regex.IsMatch(request.Period, @"^\d{4}-\d{2}$"))
        {
            return BadRequest(new { error = "Invalid period format. Must be YYYY-MM" });
        }

        try
        {
            var exception = await _exceptionService.CreateAsync(request, userId);
            return CreatedAtAction(nameof(GetAll), new { }, exception);
        }
        catch (Npgsql.PostgresException ex) when (ex.SqlState == "23505") // unique_violation
        {
            return Conflict(new { error = "An exception already exists for this employee and period" });
        }
    }

    [RequirePermission("supervisions.delete")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId()!.Value;

        var success = await _exceptionService.DeleteAsync(id, userId);
        if (!success) return NotFound();

        return Ok(new { message = "Supervision exception deleted" });
    }
}
