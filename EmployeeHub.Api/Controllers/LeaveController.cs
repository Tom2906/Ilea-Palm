using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/leave")]
public class LeaveController : ControllerBase
{
    private readonly ILeaveService _leaveService;
    private readonly IDbService _db;

    public LeaveController(ILeaveService leaveService, IDbService db)
    {
        _leaveService = leaveService;
        _db = db;
    }

    [HttpGet("requests")]
    public async Task<IActionResult> GetRequests([FromQuery] Guid? employeeId = null, [FromQuery] string? status = null)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var scope = User.GetDataScope();

        if (scope == "own")
        {
            // Own data only
            var empId = User.GetEmployeeId();
            if (empId == null) return Ok(new List<LeaveRequestResponse>());
            employeeId = empId;
        }
        else if (scope == "reports")
        {
            // Direct reports + own
            if (employeeId.HasValue)
            {
                if (!await IsInScope(employeeId.Value))
                    return StatusCode(403);
            }
        }
        // scope == "all" → no filter needed

        var requests = await _leaveService.GetRequestsAsync(employeeId, status);

        // Post-filter for "reports" scope when no specific employee requested
        if (scope == "reports" && !employeeId.HasValue)
        {
            var myEmpId = User.GetEmployeeId();
            var reportIds = await GetDirectReportIds();
            requests = requests.Where(r =>
                r.EmployeeId == myEmpId || reportIds.Contains(r.EmployeeId)).ToList();
        }

        return Ok(requests);
    }

    [HttpPost("requests")]
    public async Task<IActionResult> CreateRequest([FromBody] CreateLeaveRequestRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        // Users can always create leave for themselves; only "all" scope can create for others
        var scope = User.GetDataScope();
        if (scope != "all")
        {
            var empId = User.GetEmployeeId();
            if (empId == null || request.EmployeeId != empId)
                return StatusCode(403);
        }

        try
        {
            var result = await _leaveService.CreateRequestAsync(request, userId.Value);
            return CreatedAtAction(nameof(GetRequests), new { }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("requests/{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateLeaveStatusRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        // Users without leave.approve can only cancel their own
        if (!User.HasPermission("leave.approve"))
        {
            if (request.Status != "cancelled")
                return StatusCode(403);

            var existing = await _leaveService.GetRequestByIdAsync(id);
            if (existing == null) return NotFound();

            var empId = User.GetEmployeeId();
            if (existing.EmployeeId != empId)
                return StatusCode(403);
        }
        else
        {
            // Has leave.approve — check scope
            var existing = await _leaveService.GetRequestByIdAsync(id);
            if (existing == null) return NotFound();

            if (!await IsInScope(existing.EmployeeId))
                return StatusCode(403);
        }

        try
        {
            var result = await _leaveService.UpdateStatusAsync(id, request, userId.Value);
            if (result == null) return NotFound();
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("balance/{employeeId:guid}/{year:int}")]
    public async Task<IActionResult> GetBalance(Guid employeeId, int year)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        if (!await IsInScope(employeeId))
            return StatusCode(403);

        var balance = await _leaveService.GetBalanceAsync(employeeId, year);
        return Ok(balance);
    }

    [HttpPost("entitlements")]
    public async Task<IActionResult> SetEntitlement([FromBody] SetLeaveEntitlementRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("leave.manage_entitlements")) return StatusCode(403);

        var result = await _leaveService.SetEntitlementAsync(request, userId.Value);
        return Ok(result);
    }

    [HttpGet("entitlements")]
    public async Task<IActionResult> GetEntitlements([FromQuery] int? year = null)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("leave.manage_entitlements")) return StatusCode(403);

        var targetYear = year ?? DateTime.UtcNow.Year;
        var entitlements = await _leaveService.GetEntitlementsAsync(targetYear);
        return Ok(entitlements);
    }

    private async Task<bool> IsInScope(Guid employeeId)
    {
        var scope = User.GetDataScope();
        if (scope == "all") return true;
        if (scope == "own") return User.GetEmployeeId() == employeeId;
        if (scope == "reports") return User.GetEmployeeId() == employeeId || await IsManagerOfEmployee(employeeId);
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

    private async Task<HashSet<Guid>> GetDirectReportIds()
    {
        var myEmpId = User.GetEmployeeId();
        if (myEmpId == null) return new HashSet<Guid>();

        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT id FROM employees WHERE reports_to = @managerId AND active = true", conn);
        cmd.Parameters.AddWithValue("managerId", myEmpId.Value);

        var ids = new HashSet<Guid>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            ids.Add(reader.GetGuid(0));

        return ids;
    }
}
