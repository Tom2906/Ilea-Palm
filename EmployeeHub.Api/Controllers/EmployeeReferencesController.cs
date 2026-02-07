using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/employees/{employeeId:guid}/references")]
public class EmployeeReferencesController : ControllerBase
{
    private readonly IEmployeeReferenceService _refService;

    public EmployeeReferencesController(IEmployeeReferenceService refService)
    {
        _refService = refService;
    }

    [HttpGet]
    public async Task<IActionResult> GetByEmployee(Guid employeeId)
    {
        if (User.GetUserId() == null) return Unauthorized();
        if (!User.HasPermission("employees.view") && User.GetEmployeeId() != employeeId)
            return StatusCode(403);

        var refs = await _refService.GetByEmployeeAsync(employeeId);
        var response = refs.Select(r => MapToResponse(r));
        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid employeeId, [FromBody] CreateEmployeeReferenceRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("employees.edit")) return StatusCode(403);

        var reference = await _refService.CreateAsync(employeeId, request, userId.Value);
        return CreatedAtAction(nameof(GetByEmployee), new { employeeId }, MapToResponse(reference));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid employeeId, Guid id, [FromBody] UpdateEmployeeReferenceRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("employees.edit")) return StatusCode(403);

        var reference = await _refService.UpdateAsync(id, request, userId.Value);
        if (reference == null) return NotFound();

        return Ok(MapToResponse(reference));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid employeeId, Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("employees.edit")) return StatusCode(403);

        var success = await _refService.DeleteAsync(id, userId.Value);
        if (!success) return NotFound();

        return Ok(new { message = "Reference deleted" });
    }

    private static EmployeeReferenceResponse MapToResponse(Models.EmployeeReference r) => new()
    {
        Id = r.Id,
        EmployeeId = r.EmployeeId,
        ReferenceNumber = r.ReferenceNumber,
        ContactName = r.ContactName,
        ContactCompany = r.ContactCompany,
        ContactEmail = r.ContactEmail,
        ContactPhone = r.ContactPhone,
        Received = r.Received,
        VerbalRef = r.VerbalRef,
        DateRequested = r.DateRequested,
        DateReceived = r.DateReceived,
        Notes = r.Notes,
        CreatedAt = r.CreatedAt,
        UpdatedAt = r.UpdatedAt
    };
}
