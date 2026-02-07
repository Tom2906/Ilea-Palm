using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/leave")]
public class LeaveController : ControllerBase
{
    private readonly ILeaveService _leaveService;

    public LeaveController(ILeaveService leaveService)
    {
        _leaveService = leaveService;
    }

    [HttpGet("requests")]
    public async Task<IActionResult> GetRequests([FromQuery] Guid? employeeId = null, [FromQuery] string? status = null)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        // leave.view = see all requests; no leave.view = own only (self-service)
        var myEmpId = User.GetEmployeeId();
        if (!User.HasPermission("leave.view"))
        {
            if (myEmpId == null) return Ok(new List<LeaveRequestResponse>());
            var ownRequests = await _leaveService.GetRequestsAsync(myEmpId, status);
            return Ok(ownRequests);
        }

        var requests = await _leaveService.GetRequestsAsync(employeeId, status);
        return Ok(requests);
    }

    [HttpPost("requests")]
    public async Task<IActionResult> CreateRequest([FromBody] CreateLeaveRequestRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        // Users can always create leave for themselves; need leave.view to create for others
        var empId = User.GetEmployeeId();
        if (empId == null || request.EmployeeId != empId)
        {
            if (!User.HasPermission("leave.view")) return StatusCode(403);
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

        // Without leave.approve, users can only cancel their own
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

        // Self-service: users can always view their own balance
        var myEmpId = User.GetEmployeeId();
        if (myEmpId != employeeId && !User.HasPermission("leave.view"))
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
}
