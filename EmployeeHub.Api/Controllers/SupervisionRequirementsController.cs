using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/supervision-requirements")]
public class SupervisionRequirementsController : ControllerBase
{
    private readonly ISupervisionRequirementService _service;

    public SupervisionRequirementsController(ISupervisionRequirementService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (User.GetUserId() == null) return Unauthorized();
        if (!User.HasPermission("supervisions.view")) return StatusCode(403);

        var requirements = await _service.GetAllAsync();
        return Ok(requirements);
    }

    [HttpGet("employee/{employeeId:guid}")]
    public async Task<IActionResult> GetByEmployee(Guid employeeId)
    {
        if (User.GetUserId() == null) return Unauthorized();
        if (!User.HasPermission("supervisions.view")) return StatusCode(403);

        var requirements = await _service.GetByEmployeeAsync(employeeId);
        return Ok(requirements);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        if (User.GetUserId() == null) return Unauthorized();
        if (!User.HasPermission("supervisions.view")) return StatusCode(403);

        var requirement = await _service.GetByIdAsync(id);
        if (requirement == null) return NotFound();
        return Ok(requirement);
    }

    [HttpGet("employee/{employeeId:guid}/month/{month}")]
    public async Task<IActionResult> GetRequirementForMonth(Guid employeeId, string month)
    {
        if (User.GetUserId() == null) return Unauthorized();
        if (!User.HasPermission("supervisions.view")) return StatusCode(403);

        // month format: "YYYY-MM"
        if (!DateOnly.TryParse(month + "-01", out var date))
            return BadRequest("Invalid month format. Use YYYY-MM");

        var requirement = await _service.GetRequirementForMonthAsync(employeeId, date);
        return Ok(requirement);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateSupervisionRequirementRequest request)
    {
        if (User.GetUserId() == null) return Unauthorized();
        if (!User.HasPermission("supervisions.edit")) return StatusCode(403);

        var requirement = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = requirement.Id }, requirement);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateSupervisionRequirementRequest request)
    {
        if (User.GetUserId() == null) return Unauthorized();
        if (!User.HasPermission("supervisions.edit")) return StatusCode(403);

        var requirement = await _service.UpdateAsync(id, request);
        if (requirement == null) return NotFound();
        return Ok(requirement);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (User.GetUserId() == null) return Unauthorized();
        if (!User.HasPermission("supervisions.delete")) return StatusCode(403);

        var deleted = await _service.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
