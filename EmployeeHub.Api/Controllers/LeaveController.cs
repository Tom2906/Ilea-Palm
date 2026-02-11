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

    [RequirePermission]
    [HttpGet("requests")]
    public async Task<IActionResult> GetRequests([FromQuery] Guid? employeeId = null, [FromQuery] string? status = null)
    {
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

    [RequirePermission]
    [HttpPost("requests")]
    public async Task<IActionResult> CreateRequest([FromBody] CreateLeaveRequestRequest request)
    {
        var userId = User.GetUserId()!.Value;

        // Users can always create leave for themselves; need leave.view to create for others
        var empId = User.GetEmployeeId();
        if (empId == null || request.EmployeeId != empId)
        {
            if (!User.HasPermission("leave.view")) return StatusCode(403);
        }

        var result = await _leaveService.CreateRequestAsync(request, userId);
        return CreatedAtAction(nameof(GetRequests), new { }, result);
    }

    [RequirePermission]
    [HttpPut("requests/{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateLeaveStatusRequest request)
    {
        var userId = User.GetUserId()!.Value;

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

        var result = await _leaveService.UpdateStatusAsync(id, request, userId);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [RequirePermission]
    [HttpGet("balance/{employeeId:guid}/{year:int}")]
    public async Task<IActionResult> GetBalance(Guid employeeId, int year)
    {
        // Self-service: users can always view their own balance
        var myEmpId = User.GetEmployeeId();
        if (myEmpId != employeeId && !User.HasPermission("leave.view"))
            return StatusCode(403);

        var balance = await _leaveService.GetBalanceAsync(employeeId, year);
        return Ok(balance);
    }

    [RequirePermission("leave.manage_entitlements")]
    [HttpPost("entitlements")]
    public async Task<IActionResult> SetEntitlement([FromBody] SetLeaveEntitlementRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var result = await _leaveService.SetEntitlementAsync(request, userId);
        return Ok(result);
    }

    [RequirePermission("leave.manage_entitlements")]
    [HttpGet("entitlements")]
    public async Task<IActionResult> GetEntitlements([FromQuery] int? year = null)
    {

        var targetYear = year ?? DateTime.UtcNow.Year;
        var entitlements = await _leaveService.GetEntitlementsAsync(targetYear);
        return Ok(entitlements);
    }
}
